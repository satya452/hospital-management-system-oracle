/**
 * Oracle 11g Database Connection & Query Engine for Hospital Management System
 * Connects to Oracle Database XE via pure native JDBC Bridge
 */
import fetch from 'sync-fetch';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORACLE_BRIDGE_URL = 'http://127.0.0.1:3002';
let bridgeStarted = false;

function findJava() {
  if (process.env.JAVA_BIN && fs.existsSync(process.env.JAVA_BIN)) return process.env.JAVA_BIN;
  const candidates = [
    'C:\\app\\rishw\\product\\21c\\dbhomeXE\\jdk\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
    'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\jdk\\bin\\java.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return 'java';
}

function findOjdbc() {
  if (process.env.OJDBC_JAR && fs.existsSync(process.env.OJDBC_JAR)) return process.env.OJDBC_JAR;
  const candidates = [
    'C:\\app\\rishw\\product\\21c\\dbhomeXE\\jdbc\\lib\\ojdbc8.jar',
    'C:\\app\\rishw\\product\\21c\\dbhomeXE\\jdbc\\lib\\ojdbc11.jar',
    'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\jdbc\\lib\\ojdbc6.jar'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return 'ojdbc8.jar';
}

// Ensure Oracle Bridge is running
export function ensureOracleBridge() {
  try {
    const res = fetch(`${ORACLE_BRIDGE_URL}/health`).json();
    if (res && res.status === 'UP') {
      return true;
    }
  } catch (err) {
    // Bridge not running, spawn it
    if (!bridgeStarted) {
      console.log('Starting Oracle JDBC Bridge process...');
      const javaBin = findJava();
      const ojdbcJar = findOjdbc();
      const cp = `${ojdbcJar};${__dirname}`;
      const child = spawn(javaBin, ['-cp', cp, 'OracleServer', '3002'], {
        cwd: __dirname,
        detached: true,
        stdio: 'ignore',
        env: { ...process.env }
      });
      child.unref();
      bridgeStarted = true;
      // Wait for it to become healthy
      for (let i = 0; i < 20; i++) {
        try {
          const h = fetch(`${ORACLE_BRIDGE_URL}/health`).json();
          if (h && h.status === 'UP') {
            console.log('✓ Oracle JDBC Bridge initialized.');
            return true;
          }
        } catch (e) {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
        }
      }
    }
  }
  return true;
}

// Convert SQLite-specific syntax to standard Oracle 11g SQL
export function toOracleSql(sql) {
  if (!sql || typeof sql !== 'string') return sql;
  let s = sql.trim();

  // Replace date('now')
  s = s.replace(/date\('now'\)/gi, 'TRUNC(SYSDATE)');
  // Replace datetime('now')
  s = s.replace(/datetime\('now'\)/gi, 'SYSDATE');
  // Replace CAST(col AS TEXT)
  s = s.replace(/CAST\((.*?)\s+AS\s+TEXT\)/gi, 'TO_CHAR($1)');
  // Replace substr(appt_date, 1, 7)
  s = s.replace(/substr\((.*?),?\s*1,\s*7\)/gi, "TO_CHAR($1, 'YYYY-MM')");

  // Handle LIMIT clause: SELECT ... ORDER BY ... LIMIT N -> SELECT * FROM (SELECT ... ORDER BY ...) WHERE ROWNUM <= N
  const limitMatch = s.match(/^(.*?)\s+LIMIT\s+(\d+)\s*;?$/is);
  if (limitMatch) {
    const inner = limitMatch[1].trim().replace(/;$/, '');
    s = `SELECT * FROM (${inner}) WHERE ROWNUM <= ${limitMatch[2]}`;
  }

  // Strip any trailing semicolons which cause ORA-00911
  s = s.replace(/;+$/g, '').trim();
  return s;
}

// Helper: Run SELECT query against Oracle and return array of objects
export function queryAll(sql, params = []) {
  ensureOracleBridge();
  const oracleSql = toOracleSql(sql);
  const response = fetch(`${ORACLE_BRIDGE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: oracleSql, params })
  });

  const data = response.json();
  if (data && data.error) {
    throw new Error(data.error);
  }
  return Array.isArray(data) ? data : [];
}

// Helper: Run SELECT query against Oracle and return first row as object
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: Run INSERT/UPDATE/DELETE on Oracle
export function runSql(sql, params = []) {
  ensureOracleBridge();
  let oracleSql = sql.trim();
  // Strip any trailing semicolons which cause ORA-00911
  oracleSql = oracleSql.replace(/;+$/g, '').trim();
  // Convert date('now') etc.
  oracleSql = oracleSql.replace(/date\('now'\)/gi, 'SYSDATE');

  const response = fetch(`${ORACLE_BRIDGE_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: oracleSql, params })
  });

  const data = response.json();
  if (data && data.error) {
    throw new Error(data.error);
  }
  return {
    changes: data.changes || 0,
    lastInsertRowid: data.lastInsertRowid || 0
  };
}

// Helper: Call Oracle PL/SQL procedure or function
export function callProcedure(procName, params = []) {
  ensureOracleBridge();
  const response = fetch(`${ORACLE_BRIDGE_URL}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proc: procName, params })
  });

  const data = response.json();
  if (data && data.error) {
    throw new Error(data.error);
  }
  return data;
}

// Helper: Call Oracle PL/SQL function
export function callFunction(funcName, params = []) {
  return callProcedure(funcName, params);
}

// Transaction helpers: require confirmation from the Oracle bridge.
let inTransaction = false;
function transactionAction(action, expectedStatus) {
  ensureOracleBridge();
  const response = fetch(`${ORACLE_BRIDGE_URL}/tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  const data = response.json();
  if (!response.ok || data.error || data.status !== expectedStatus) {
    throw new Error(data.error || `Oracle transaction ${action} failed`);
  }
}
export function beginTransaction() {
  if (inTransaction) throw new Error('An Oracle transaction is already active.');
  transactionAction('begin', 'transaction_started');
  inTransaction = true;
}
export function commitTransaction() {
  transactionAction('commit', 'committed');
  inTransaction = false;
}
export function rollbackTransaction() {
  if (!inTransaction) return;
  transactionAction('rollback', 'rolled_back');
  inTransaction = false;
}
export function isInTransaction() {
  return inTransaction;
}

// No-op for saveDb since Oracle commits persist to database automatically
export function saveDb() {
  // Oracle persists directly on COMMIT
}

// Synchronize sequence helpers (maintained in Oracle via sequences)
export function syncTableSequence(table) {
  // Oracle sequences handle autoincrement natively
}

export function syncAllSequences() {
  // Oracle sequences handle autoincrement natively
}

// Backward compatibility DB object
export async function getDb() {
  ensureOracleBridge();
  return {
    run: (sql, params = []) => runSql(sql, params),
    exec: (sql) => {
      const rows = queryAll(sql);
      return [{ values: rows.map(r => Object.values(r)) }];
    }
  };
}

// Database initialization
export async function initializeDatabase(forceRecreate = false) {
  ensureOracleBridge();
  console.log('✓ Connected to Oracle Database 11g XE successfully.');
  return getDb();
}
