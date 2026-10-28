import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.sql.*;
import java.util.*;

public class OracleServer {
    private static final String DB_URL = System.getenv().getOrDefault("ORACLE_JDBC_URL", "jdbc:oracle:thin:@localhost:1521:XE");
    private static final String DB_USER = System.getenv().getOrDefault("ORACLE_USER", "hms");
    private static final String DB_PASS = System.getenv("ORACLE_PASSWORD");
    private static Connection txConn = null;

    private static Connection getConnection() throws SQLException {
        if (DB_PASS == null || DB_PASS.trim().isEmpty()) throw new SQLException("Set ORACLE_PASSWORD before starting the Oracle bridge.");
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 3002;
        Class.forName("oracle.jdbc.driver.OracleDriver");

        // Verify connection on startup
        try (Connection testConn = getConnection()) {
            System.out.println("✓ Oracle 11g JDBC Connected successfully as " + DB_USER);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);

        server.createContext("/health", exchange -> {
            sendResponse(exchange, 200, "{\"status\":\"UP\",\"database\":\"Oracle 11g XE\"}");
        });

        server.createContext("/query", new QueryHandler());
        server.createContext("/execute", new ExecuteHandler());
        server.createContext("/call", new CallHandler());
        server.createContext("/tx", new TxHandler());

        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());
        server.start();
        System.out.println("Oracle Bridge Server listening on http://127.0.0.1:" + port);
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes("UTF-8");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    // Parse simple JSON { "sql": "...", "params": [...] }
    private static Map<String, Object> parseJson(String json) {
        Map<String, Object> map = new HashMap<>();
        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1).trim();
        }

        // Custom parser or standard extraction for sql, proc, params
        int sqlIdx = json.indexOf("\"sql\":");
        if (sqlIdx != -1) {
            int start = json.indexOf("\"", sqlIdx + 6);
            if (start != -1) {
                StringBuilder sqlVal = new StringBuilder();
                boolean escape = false;
                int i = start + 1;
                while (i < json.length()) {
                    char c = json.charAt(i);
                    if (escape) {
                        if (c == 'n') sqlVal.append('\n');
                        else if (c == 'r') sqlVal.append('\r');
                        else if (c == 't') sqlVal.append('\t');
                        else sqlVal.append(c);
                        escape = false;
                    } else if (c == '\\') {
                        escape = true;
                    } else if (c == '"') {
                        break;
                    } else {
                        sqlVal.append(c);
                    }
                    i++;
                }
                map.put("sql", sqlVal.toString());
            }
        }

        int procIdx = json.indexOf("\"proc\":");
        if (procIdx != -1) {
            int start = json.indexOf("\"", procIdx + 7);
            if (start != -1) {
                int end = json.indexOf("\"", start + 1);
                map.put("proc", json.substring(start + 1, end));
            }
        }

        java.util.regex.Matcher actionMatcher = java.util.regex.Pattern
            .compile("\"action\"\\s*:\\s*\"(begin|commit|rollback)\"")
            .matcher(json);
        if (actionMatcher.find()) map.put("action", actionMatcher.group(1));

        // Parse params array: "params": [ ... ]
        int paramsIdx = json.indexOf("\"params\":");
        List<Object> paramsList = new ArrayList<>();
        if (paramsIdx != -1) {
            int arrStart = json.indexOf("[", paramsIdx);
            int arrEnd = json.lastIndexOf("]");
            if (arrStart != -1 && arrEnd != -1 && arrEnd > arrStart) {
                String inside = json.substring(arrStart + 1, arrEnd).trim();
                if (!inside.isEmpty()) {
                    List<String> tokens = splitJsonArray(inside);
                    for (String tok : tokens) {
                        tok = tok.trim();
                        if (tok.startsWith("\"") && tok.endsWith("\"")) {
                            paramsList.add(tok.substring(1, tok.length() - 1).replace("\\\"", "\"").replace("\\\\", "\\"));
                        } else if ("null".equalsIgnoreCase(tok)) {
                            paramsList.add(null);
                        } else if ("true".equalsIgnoreCase(tok)) {
                            paramsList.add(Boolean.TRUE);
                        } else if ("false".equalsIgnoreCase(tok)) {
                            paramsList.add(Boolean.FALSE);
                        } else {
                            try {
                                if (tok.contains(".")) {
                                    paramsList.add(Double.parseDouble(tok));
                                } else {
                                    paramsList.add(Long.parseLong(tok));
                                }
                            } catch (Exception e) {
                                paramsList.add(tok);
                            }
                        }
                    }
                }
            }
        }
        map.put("params", paramsList);
        return map;
    }

    private static List<String> splitJsonArray(String s) {
        List<String> list = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inStr = false;
        boolean escape = false;
        int depth = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (escape) {
                cur.append(c);
                escape = false;
            } else if (c == '\\') {
                cur.append(c);
                escape = true;
            } else if (c == '"') {
                inStr = !inStr;
                cur.append(c);
            } else if (!inStr) {
                if (c == '[' || c == '{') depth++;
                else if (c == ']' || c == '}') depth--;
                else if (c == ',' && depth == 0) {
                    list.add(cur.toString());
                    cur = new StringBuilder();
                    continue;
                }
                cur.append(c);
            } else {
                cur.append(c);
            }
        }
        if (cur.length() > 0) list.add(cur.toString());
        return list;
    }

    // Bind parameters to PreparedStatement
    private static void bindParams(PreparedStatement stmt, List<Object> params) throws SQLException {
        if (params == null) return;
        for (int i = 0; i < params.size(); i++) {
            Object p = params.get(i);
            if (p == null) {
                stmt.setNull(i + 1, Types.VARCHAR);
            } else if (p instanceof Number) {
                if (p instanceof Double || p instanceof Float) {
                    stmt.setDouble(i + 1, ((Number) p).doubleValue());
                } else {
                    stmt.setLong(i + 1, ((Number) p).longValue());
                }
            } else if (p instanceof Boolean) {
                stmt.setBoolean(i + 1, (Boolean) p);
            } else {
                String str = p.toString();
                // Check if string is date format YYYY-MM-DD
                if (str.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                    stmt.setDate(i + 1, java.sql.Date.valueOf(str));
                } else {
                    stmt.setString(i + 1, str);
                }
            }
        }
    }

    // Convert ResultSet to JSON array
    private static String resultSetToJson(ResultSet rs) throws SQLException {
        ResultSetMetaData md = rs.getMetaData();
        int cols = md.getColumnCount();
        StringBuilder sb = new StringBuilder("[");
        boolean firstRow = true;
        while (rs.next()) {
            if (!firstRow) sb.append(",");
            firstRow = false;
            sb.append("{");
            for (int i = 1; i <= cols; i++) {
                if (i > 1) sb.append(",");
                String colName = md.getColumnLabel(i).toLowerCase();
                sb.append("\"").append(escapeJson(colName)).append("\":");
                Object val = rs.getObject(i);
                if (val == null) {
                    sb.append("null");
                } else if (val instanceof Number) {
                    sb.append(val);
                } else if (val instanceof Boolean) {
                    sb.append(val);
                } else if (val instanceof java.sql.Date || val instanceof java.sql.Timestamp) {
                    String str = val.toString();
                    if (str.length() >= 10) str = str.substring(0, 10);
                    sb.append("\"").append(escapeJson(str)).append("\"");
                } else {
                    sb.append("\"").append(escapeJson(val.toString())).append("\"");
                }
            }
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        String t = "000" + Integer.toHexString(c);
                        sb.append("\\u").append(t.substring(t.length() - 4));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    // /query handler: returns JSON array
    static class QueryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }
            try {
                String body = readBody(exchange);
                Map<String, Object> req = parseJson(body);
                String sql = (String) req.get("sql");
                @SuppressWarnings("unchecked")
                List<Object> params = (List<Object>) req.get("params");

                Connection conn = txConn != null ? txConn : getConnection();
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    bindParams(stmt, params);
                    try (ResultSet rs = stmt.executeQuery()) {
                        String json = resultSetToJson(rs);
                        sendResponse(exchange, 200, json);
                    }
                } finally {
                    if (txConn == null) conn.close();
                }
            } catch (Exception e) {
                sendResponse(exchange, 400, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    // /execute handler: runs INSERT/UPDATE/DELETE, returns { changes: n, lastId: id }
    static class ExecuteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }
            try {
                String body = readBody(exchange);
                Map<String, Object> req = parseJson(body);
                String sql = (String) req.get("sql");
                @SuppressWarnings("unchecked")
                List<Object> params = (List<Object>) req.get("params");

                Connection conn = txConn != null ? txConn : getConnection();
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    bindParams(stmt, params);
                    int affected = stmt.executeUpdate();
                    long lastId = 0;
                    String upper = sql.trim().toUpperCase();
                    if (upper.startsWith("INSERT INTO ")) {
                        String table = upper.substring(12).trim().split("[\\s(]")[0];
                        String seq = getSeqForTable(table);
                        if (seq != null) {
                            try (Statement s = conn.createStatement();
                                 ResultSet rs = s.executeQuery("SELECT " + seq + ".CURRVAL FROM dual")) {
                                if (rs.next()) lastId = rs.getLong(1);
                            } catch (Exception ignored) {}
                        }
                    }
                    sendResponse(exchange, 200, "{\"changes\":" + affected + ",\"lastInsertRowid\":" + lastId + "}");
                } finally {
                    if (txConn == null) conn.close();
                }
            } catch (Exception e) {
                sendResponse(exchange, 400, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    private static String getSeqForTable(String table) {
        if ("DEPARTMENT".equalsIgnoreCase(table)) return "dept_seq";
        if ("DOCTOR".equalsIgnoreCase(table)) return "doctor_seq";
        if ("PATIENT".equalsIgnoreCase(table)) return "patient_seq";
        if ("APPOINTMENT".equalsIgnoreCase(table)) return "appt_seq";
        if ("MEDICINE".equalsIgnoreCase(table)) return "medicine_seq";
        if ("PRESCRIPTION".equalsIgnoreCase(table)) return "presc_seq";
        if ("BILL".equalsIgnoreCase(table)) return "bill_seq";
        return null;
    }

    // /call handler: calls PL/SQL procedure or function
    static class CallHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }
            try {
                String body = readBody(exchange);
                Map<String, Object> req = parseJson(body);
                String proc = (String) req.get("proc");
                @SuppressWarnings("unchecked")
                List<Object> params = (List<Object>) req.get("params");

                Connection conn = txConn != null ? txConn : getConnection();
                try {
                    String lower = proc.toLowerCase().trim();

                    if ("func_check_doctor_available".equals(lower)) {
                        // Function: returns NUMBER
                        try (CallableStatement cstmt = conn.prepareCall("{? = call func_check_doctor_available(?, ?, ?)}")) {
                            cstmt.registerOutParameter(1, Types.NUMERIC);
                            cstmt.setLong(2, ((Number) params.get(0)).longValue());
                            cstmt.setDate(3, java.sql.Date.valueOf(params.get(1).toString().substring(0, 10)));
                            cstmt.setString(4, params.get(2).toString());
                            cstmt.execute();
                            int res = cstmt.getInt(1);
                            sendResponse(exchange, 200, "{\"result\":" + res + "}");
                        }
                    } else if ("func_get_patient_total_spend".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{? = call func_get_patient_total_spend(?)}")) {
                            cstmt.registerOutParameter(1, Types.NUMERIC);
                            cstmt.setLong(2, ((Number) params.get(0)).longValue());
                            cstmt.execute();
                            double res = cstmt.getDouble(1);
                            sendResponse(exchange, 200, "{\"total_spend\":" + res + "}");
                        }
                    } else if ("cursor_patient_visit_summary".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call cursor_patient_visit_summary(?, ?)}")) {
                            cstmt.setLong(1, ((Number) params.get(0)).longValue());
                            cstmt.registerOutParameter(2, oracle.jdbc.OracleTypes.CURSOR);
                            cstmt.execute();
                            try (ResultSet rs = (ResultSet) cstmt.getObject(2)) {
                                String json = resultSetToJson(rs);
                                sendResponse(exchange, 200, json);
                            }
                        }
                    } else if ("procedure_auto_bill".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call procedure_auto_bill(?, ?, ?, ?, ?)}")) {
                            cstmt.setLong(1, ((Number) params.get(0)).longValue());
                            cstmt.registerOutParameter(2, Types.NUMERIC);
                            cstmt.registerOutParameter(3, Types.NUMERIC);
                            cstmt.registerOutParameter(4, Types.NUMERIC);
                            cstmt.registerOutParameter(5, Types.NUMERIC);
                            cstmt.execute();
                            long billId = cstmt.getLong(2);
                            double fee = cstmt.getDouble(3);
                            double med = cstmt.getDouble(4);
                            double total = cstmt.getDouble(5);
                            sendResponse(exchange, 200, "{\"bill_id\":" + billId + ",\"consultation_charge\":" + fee + ",\"medicine_charge\":" + med + ",\"total_amount\":" + total + "}");
                        }
                    } else if ("procedure_complete_appointment".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call procedure_complete_appointment(?, ?, ?, ?)}")) {
                            cstmt.setLong(1, ((Number) params.get(0)).longValue());
                            cstmt.setString(2, params.get(1) != null ? params.get(1).toString() : null);
                            cstmt.registerOutParameter(3, Types.NUMERIC);
                            cstmt.registerOutParameter(4, Types.NUMERIC);
                            cstmt.execute();
                            long billId = cstmt.getLong(3);
                            double total = cstmt.getDouble(4);
                            sendResponse(exchange, 200, "{\"bill_id\":" + billId + ",\"total_amount\":" + total + "}");
                        }
                    } else if ("txn_patient_onboarding".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call txn_patient_onboarding(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
                            cstmt.setString(1, params.get(0).toString()); // name
                            cstmt.setDate(2, java.sql.Date.valueOf(params.get(1).toString().substring(0, 10))); // dob
                            cstmt.setString(3, params.get(2).toString()); // gender
                            cstmt.setString(4, params.get(3).toString()); // blood_group
                            cstmt.setString(5, params.get(4).toString()); // phone
                            cstmt.setString(6, params.get(5) != null ? params.get(5).toString() : null); // address
                            cstmt.setLong(7, ((Number) params.get(6)).longValue()); // doctor_id
                            cstmt.setDate(8, java.sql.Date.valueOf(params.get(7).toString().substring(0, 10))); // appt_date
                            cstmt.setString(9, params.get(8).toString()); // appt_time
                            cstmt.registerOutParameter(10, Types.NUMERIC); // patient_id
                            cstmt.registerOutParameter(11, Types.NUMERIC); // appt_id
                            cstmt.execute();
                            long patientId = cstmt.getLong(10);
                            long apptId = cstmt.getLong(11);
                            sendResponse(exchange, 200, "{\"patient_id\":" + patientId + ",\"appt_id\":" + apptId + "}");
                        }
                    } else if ("txn_consultation_prescription".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call txn_consultation_prescription(?, ?, ?)}")) {
                            cstmt.setLong(1, ((Number) params.get(0)).longValue());
                            cstmt.setString(2, params.get(1) == null ? null : params.get(1).toString());
                            String xml = params.get(2).toString();
                            cstmt.setCharacterStream(3, new StringReader(xml), xml.length());
                            cstmt.execute();
                            sendResponse(exchange, 200, "{\"status\":\"committed\"}");
                        }
                    } else if ("txn_inventory_restock".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call txn_inventory_restock(?, ?, ?)}")) {
                            bindParams(cstmt, params);
                            cstmt.execute();
                            sendResponse(exchange, 200, "{\"status\":\"committed\"}");
                        }
                    } else if ("txn_billing_payment".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call txn_billing_payment(?, ?, ?)}")) {
                            cstmt.setLong(1, ((Number) params.get(0)).longValue());
                            cstmt.registerOutParameter(2, Types.NUMERIC);
                            cstmt.registerOutParameter(3, Types.NUMERIC);
                            cstmt.execute();
                            long billId = cstmt.getLong(2);
                            double total = cstmt.getDouble(3);
                            sendResponse(exchange, 200, "{\"bill_id\":" + billId + ",\"total_amount\":" + total + "}");
                        }
                    } else if ("txn_cancel_appointment".equals(lower)) {
                        try (CallableStatement cstmt = conn.prepareCall("{call txn_cancel_appointment(?)}")) {
                            cstmt.setLong(1, ((Number) params.get(0)).longValue());
                            cstmt.execute();
                            sendResponse(exchange, 200, "{\"message\":\"Appointment cancelled\"}");
                        }
                    } else {
                        // Generic PL/SQL anonymous block execution
                        String rawSql = (String) req.get("sql");
                        if (rawSql != null) {
                            try (CallableStatement cstmt = conn.prepareCall(rawSql)) {
                                bindParams(cstmt, params);
                                cstmt.execute();
                                sendResponse(exchange, 200, "{\"status\":\"ok\"}");
                            }
                        } else {
                            sendResponse(exchange, 400, "{\"error\":\"Unknown procedure: " + proc + "\"}");
                        }
                    }
                } finally {
                    if (txConn == null) conn.close();
                }
            } catch (Exception e) {
                sendResponse(exchange, 400, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    // /tx handler: begin, commit, rollback
    static class TxHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                String body = readBody(exchange);
                Map<String, Object> req = parseJson(body);
                String action = (String) req.get("action");
                if ("begin".equalsIgnoreCase(action)) {
                    if (txConn != null) {
                        try { txConn.rollback(); txConn.close(); } catch(Exception ignored){}
                    }
                    txConn = getConnection();
                    txConn.setAutoCommit(false);
                    sendResponse(exchange, 200, "{\"status\":\"transaction_started\"}");
                } else if ("commit".equalsIgnoreCase(action)) {
                    if (txConn != null) {
                        txConn.commit();
                        txConn.close();
                        txConn = null;
                    }
                    sendResponse(exchange, 200, "{\"status\":\"committed\"}");
                } else if ("rollback".equalsIgnoreCase(action)) {
                    if (txConn != null) {
                        try { txConn.rollback(); } catch(Exception ignored){}
                        try { txConn.close(); } catch(Exception ignored){}
                        txConn = null;
                    }
                    sendResponse(exchange, 200, "{\"status\":\"rolled_back\"}");
                } else {
                    sendResponse(exchange, 400, "{\"error\":\"Unknown action\"}");
                }
            } catch (Exception e) {
                sendResponse(exchange, 400, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }
}
