# Hospital Management System (HMS) — Full-Stack Web Application

**Course Project:** BCSE302L Database Systems  
**Project Review:** Reviews 1, 2, and 3 Compliant  

---

## 1. Team Meta Information
* **Project Title:** Hospital Management System (HMS)
* **Team Members:**
  1. **Satya Dayashankar** — Registration No: `24BDE0093`

---

## 2. Technology Stack & Architecture
* **Frontend:** React (Vite), Tailwind CSS v4, Lucide Icons, Recharts (Analytical Charts), Axios
* **Backend:** Node.js (Express REST API)
* **Database:** Oracle Database 11g Express Edition (`XE` on `localhost:1521/XE`, User: `HMS`), with native Oracle sequences, triggers, constraints, and PL/SQL stored procedures
* **Architecture Flow:**  
  `User UI Operation (React)` ➔ `Express Backend API (JavaScript)` ➔ `Native JDBC Engine (ojdbc6.jar)` ➔ `Oracle 11g Database & PL/SQL Stored Procedures / Triggers` ➔ `Table Update / Retrieval` ➔ `Live UI Render & Telemetry Execution Drawer`

---

## 3. Database Schema: 5.1 Attribute Data Types and Constraints

Strictly compliant with Review 1 & 2 Course Specifications and normalized to 3NF/BCNF:

| Table | Attribute | Data Type | Constraint |
|---|---|---|---|
| **DEPARTMENT** | `dept_id` | NUMBER(4) | PRIMARY KEY, AUTOINCREMENT (starts at 1001) |
| | `dept_name` | VARCHAR2(50) | NOT NULL, UNIQUE |
| | `location` | VARCHAR2(50) | – |
| | `phone` | VARCHAR2(10) | CHECK (length ≤ 10), Extension / Landline (e.g. '011-2001') |
| **DOCTOR** | `doctor_id` | NUMBER(5) | PRIMARY KEY, AUTOINCREMENT (starts at 10001) |
| | `doc_name` | VARCHAR2(60) | NOT NULL |
| | `specialization` | VARCHAR2(50) | NOT NULL |
| | `phone` | VARCHAR2(10) | UNIQUE, CHECK (10 digits) |
| | `email` | VARCHAR2(60) | UNIQUE, CHECK (contains `@` symbol and valid email format) |
| | `consultation_fee` | NUMBER(8,2) | CHECK (≥ 0), DEFAULT 500 |
| | `joining_date` | DATE | DEFAULT SYSDATE |
| | `dept_id` | NUMBER(4) | FK → DEPARTMENT(dept_id), NOT NULL |
| **PATIENT** | `patient_id` | NUMBER(6) | PRIMARY KEY, AUTOINCREMENT (starts at 100001) |
| | `patient_name` | VARCHAR2(60) | NOT NULL |
| | `dob` | DATE | NOT NULL |
| | `gender` | CHAR(1) | CHECK (IN 'M','F','O') |
| | `blood_group` | VARCHAR2(3) | CHECK (valid ABO/Rh group) |
| | `phone` | VARCHAR2(10) | NOT NULL, UNIQUE, CHECK (10 digits) |
| | `address` | VARCHAR2(100) | – |
| | `registered_date` | DATE | DEFAULT SYSDATE |
| **APPOINTMENT** | `appt_id` | NUMBER(7) | PRIMARY KEY, AUTOINCREMENT (starts at 2000001) |
| | `patient_id` | NUMBER(6) | FK → PATIENT(patient_id), NOT NULL |
| | `doctor_id` | NUMBER(5) | FK → DOCTOR(doctor_id), NOT NULL |
| | `appt_date` | DATE | NOT NULL, CHECK (upcoming date, cannot book in past) |
| | `appt_time` | VARCHAR2(5) | NOT NULL, CHECK (upcoming time if booking today); Active slot UNIQUE (`doctor_id`, `appt_date`, `appt_time`) where status != 'Cancelled' |
| | `status` | VARCHAR2(12) | CHECK (Scheduled/Completed/Cancelled), DEFAULT 'Scheduled' |
| | `diagnosis` | VARCHAR2(200) | – |
| **MEDICINE** | `medicine_id` | NUMBER(5) | PRIMARY KEY, AUTOINCREMENT (starts at 50001) |
| | `med_name` | VARCHAR2(60) | NOT NULL, UNIQUE |
| | `manufacturer` | VARCHAR2(60) | – |
| | `unit_price` | NUMBER(8,2) | CHECK (> 0) |
| | `stock_qty` | NUMBER(6) | CHECK (≥ 0), DEFAULT 0 |
| **PRESCRIPTION** | `presc_id` | NUMBER(8) | PRIMARY KEY, AUTOINCREMENT (starts at 30000001) |
| | `appt_id` | NUMBER(7) | FK → APPOINTMENT(appt_id), NOT NULL |
| | `medicine_id` | NUMBER(5) | FK → MEDICINE(medicine_id), NOT NULL |
| | `dosage` | VARCHAR2(60) | DEFAULT 'As prescribed' |
| | `duration_days` | NUMBER(3) | CHECK (> 0) |
| | `quantity` | NUMBER(4) | CHECK (> 0) |
| **BILL** | `bill_id` | NUMBER(8) | PRIMARY KEY, AUTOINCREMENT (starts at 40000001) |
| | `appt_id` | NUMBER(7) | FK → APPOINTMENT(appt_id), UNIQUE, NOT NULL |
| | `consultation_charge` | NUMBER(9,2) | CHECK (≥ 0), DEFAULT 0 |
| | `medicine_charge` | NUMBER(9,2) | CHECK (≥ 0), DEFAULT 0 |
| | `total_amount` | NUMBER(10,2) | CHECK (≥ 0) |
| | `payment_status` | VARCHAR2(10) | CHECK (Paid/Pending), DEFAULT 'Pending' |
| | `bill_date` | DATE | DEFAULT SYSDATE |

> **Note:** The active Oracle SQL DDL script is maintained in [`backend/oracle_schema.sql`](file:///c:/Users/krish/Projects/hms/backend/oracle_schema.sql), with all business logic compiled in [`backend/oracle_plsql.sql`](file:///c:/Users/krish/Projects/hms/backend/oracle_plsql.sql) and executed via [`backend/database.js`](file:///c:/Users/krish/Projects/hms/backend/database.js).

---

## 4. Key Business Logic & Validation Constraints

1. **Native Oracle Sequences & Autoincrement Triggers**:
   - Sequences created for all 7 primary keys (`dept_seq`, `doctor_seq`, `patient_seq`, `appt_seq`, `medicine_seq`, `presc_seq`, `bill_seq`).
   - `BEFORE INSERT` triggers automatically assign sequence `.NEXTVAL` to primary keys if omitted during insertion.

2. **Email Validation (`@` Symbol Required)**:
   - Doctor emails must be non-empty, unique, and strictly contain the `@` symbol in a valid address format (`name@domain.com`).
   - Enforced across frontend forms, Express backend API, and Oracle database `CHECK (email IS NULL OR REGEXP_LIKE(email, '^.+@.+\..+$'))` constraints.

3. **Past Date & Time Booking Prevention**:
   - Appointments cannot be booked or rescheduled for any previous date (`appt_date < today`).
   - For same-day bookings (`appt_date === today`), past time slots before the current time are disabled on the frontend and rejected with validation errors on the backend.
   - All seeded and scheduled appointments are initialized to upcoming dates and times.

4. **Record Deletion & Integrity Guards**:
   - Dedicated Delete endpoints and UI action buttons (with confirmation prompts) for patients and doctors.
   - Foreign key integrity guard prevents deletion of any patient or doctor with active appointment records.

5. **Department Phone / Intercom Extension Handling**:
   - Department contact numbers represent internal hospital extensions / landlines (e.g., `011-2001`), supporting up to 10 characters with a length constraint (`CHECK (phone IS NULL OR LENGTH(phone) <= 10)`).
   - Explicitly differentiated from personal 10-digit mobile numbers enforced for doctors and patients.

6. **Atomic Transaction Handling with COMMIT & ROLLBACK**:
   - Multi-step transactional workflows (`Onboarding`, `Consultation & Prescription`, `Billing & Payment`, `Discharge`, `Restock`, `Cancellation`) run inside strict PL/SQL transaction blocks with `COMMIT` on success and `ROLLBACK` on exception.
   - If any step fails (e.g., slot availability conflict, insufficient medicine stock, or constraint violation), all previous modifications are immediately rolled back and no partial data is committed.
   - Slot cancellation releases the schedule via an active-slot function-based unique index (`uq_appointment_active_slot`), enabling cancelled time slots to be booked again immediately without constraint violations.

---

## 5. PL/SQL Components & Business Rules (Oracle 11g)

* **Procedure 1 (`procedure_auto_bill`):** Computes `consultation_fee + SUM(unit_price * quantity)` and creates/updates snapshot record in `BILL`.
* **Procedure 2 (`procedure_complete_appointment`):** Validates completion guard, updates status to `Completed`, generates invoice, and verifies stock deductions.
* **Function 1 (`func_get_patient_total_spend`):** Returns aggregate lifetime spend for any `patient_id`.
* **Function 2 (`func_check_doctor_available`):** Returns `1` if doctor is free or `0` if booked for `(doctor_id, date, time)`.
* **Cursor 1 (`cursor_patient_visit_summary`):** Returns a `SYS_REFCURSOR` breaking down patient appointments, itemized prescriptions, and bills for clinical history.
* **Trigger 1 (`trg_inventory_auto_decrement`):** Automatically reduces `MEDICINE.stock_qty` on prescription insertion and raises `ORA-20001` if `stock_qty < quantity`.
* **Trigger 2 (`trg_appt_completion_guard`):** Prevents setting status to `'Completed'` unless associated prescription records exist (raises `ORA-20002`).

---

## 6. Review III Integrated Transactions (Dedicated Screen)

1. **Transaction 1: Patient Onboarding & Initial Booking:** Atomically inserts into `PATIENT` and `APPOINTMENT` within a transactional block, ensuring slot availability and rolling back all changes if any step fails.
2. **Transaction 2: Doctor Consultation & Prescription Processing:** Atomically inserts into `PRESCRIPTION`, fires Trigger 1 for stock reduction, and updates appointment status with rollback on insufficient stock.
3. **Transaction 3: Automated Billing & Payment Processing:** Atomically executes Procedure 1 to generate `BILL` and updates `payment_status` to `'Paid'`.
4. **Transaction 4: Inventory Restock & Price Adjustment:** Atomically updates `MEDICINE`, triggers low-stock alerts, and logs changes.
5. **Transaction 5: Appointment Cancellation & Slot Cleanup:** Updates status to `'Cancelled'`, commits atomically, and releases the doctor schedule so the cancelled slot can actually be booked again.

---

## 7. Interactive SQL Runner & Raw Query Engine (FR8)

* **17 Pre-Built Course Queries:** Covers Inner/Left Joins, Aggregations, `GROUP BY` / `HAVING`, Subqueries, and `CASE` statements.
* **Clean Clause-Per-Line Formatting:** All `SELECT` elements/columns are kept cleanly on a single line, followed by each subsequent SQL clause (`FROM`, `JOIN`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`) starting on its own line.
* **Format Query Tool:** Interactive `Format Query (Next Line)` button that automatically formats custom-typed queries.
* **Direct SELECT Pipeline:** Execution time latency measurement and tabular query output grid.

---

## 8. How to Start the Application Locally

### Step 1: Start the Backend Server
```bash
cd backend
npm install
npm run seed     # Pre-populates all 7 tables with 15-20 realistic rows with upcoming dates
npm start        # Runs Express API on http://localhost:3001
```

### Step 2: Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your web browser.


## Local Oracle configuration

Use Node.js 24 and a JDK with `javac` available. Copy `backend/.env.example` to `backend/.env` and enter your local Oracle credentials. This file is ignored by Git. The backend start, dev and seed commands load it and pass the environment to the Java bridge. Restart an existing bridge after changing credentials.

Compile the bridge from `backend` before the first run (adjust the JDBC JAR path):

```powershell
javac -encoding UTF-8 -cp "C:/oraclexe/app/oracle/product/11.2.0/server/jdbc/lib/ojdbc6.jar" OracleServer.java
```

The bridge launch JAR path is in `backend/database.js`. Oracle XE and the `hms` database user must already exist. `npm run seed` recreates the project tables and replaces their data; run it only for initial setup or an intentional reset.


Transactions 1–5 now have stored procedures in `backend/oracle_plsql.sql`. Transaction 2 accepts multiple prescriptions as XML (Oracle 11g XMLTABLE); its inserts fire the inventory trigger and its status update fires the completion guard. Transaction 4 validates and updates stock and price together. Both procedures commit on success and roll back on failure. JavaScript calls them through the JDBC bridge. After updating, apply `oracle_plsql.sql` to the existing database (without running the destructive seed), recompile Java, and restart the bridge and backend.
