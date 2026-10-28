-- ============================================================================
-- Complete Oracle 11g Schema Definition with Sequences and Triggers
-- ============================================================================

-- Drop existing objects safely
BEGIN
    FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN ('BILL','PRESCRIPTION','APPOINTMENT','MEDICINE','PATIENT','DOCTOR','DEPARTMENT')) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
    FOR s IN (SELECT sequence_name FROM user_sequences WHERE sequence_name IN ('DEPT_SEQ','DOCTOR_SEQ','PATIENT_SEQ','APPT_SEQ','MEDICINE_SEQ','PRESC_SEQ','BILL_SEQ')) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
    END LOOP;
END;
/

-- ----------------------------------------------------------------------------
-- 1. SEQUENCES
-- ----------------------------------------------------------------------------
CREATE SEQUENCE dept_seq START WITH 1001 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE doctor_seq START WITH 10001 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE patient_seq START WITH 100001 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE appt_seq START WITH 2000001 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE medicine_seq START WITH 50001 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE presc_seq START WITH 30000001 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE bill_seq START WITH 40000001 INCREMENT BY 1 NOCACHE;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE DEPARTMENT (
    dept_id     NUMBER(4) PRIMARY KEY,
    dept_name   VARCHAR2(50) NOT NULL UNIQUE,
    location    VARCHAR2(50),
    phone       VARCHAR2(10) CHECK (phone IS NULL OR LENGTH(phone) <= 10)
);

CREATE TABLE DOCTOR (
    doctor_id        NUMBER(5) PRIMARY KEY,
    doc_name         VARCHAR2(60) NOT NULL,
    specialization   VARCHAR2(50) NOT NULL,
    phone            VARCHAR2(10) UNIQUE CHECK (phone IS NULL OR (LENGTH(phone) = 10 AND REGEXP_LIKE(phone, '^[0-9]{10}$'))),
    email            VARCHAR2(60) UNIQUE CHECK (email IS NULL OR REGEXP_LIKE(email, '^.+@.+\..+$')),
    consultation_fee NUMBER(8,2) DEFAULT 500 CHECK (consultation_fee >= 0),
    joining_date     DATE DEFAULT SYSDATE,
    dept_id          NUMBER(4) NOT NULL,
    CONSTRAINT fk_doc_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);

CREATE TABLE PATIENT (
    patient_id      NUMBER(6) PRIMARY KEY,
    patient_name    VARCHAR2(60) NOT NULL,
    dob             DATE NOT NULL,
    gender          CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    blood_group     VARCHAR2(3) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone           VARCHAR2(10) NOT NULL UNIQUE CHECK (LENGTH(phone) = 10 AND REGEXP_LIKE(phone, '^[0-9]{10}$')),
    address         VARCHAR2(100),
    registered_date DATE DEFAULT SYSDATE
);

CREATE TABLE APPOINTMENT (
    appt_id      NUMBER(7) PRIMARY KEY,
    patient_id   NUMBER(6) NOT NULL,
    doctor_id    NUMBER(5) NOT NULL,
    appt_date    DATE NOT NULL,
    appt_time    VARCHAR2(5) NOT NULL,
    status       VARCHAR2(12) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    diagnosis    VARCHAR2(200),
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id),
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id)
);

-- Active slot unique constraint: allows cancelled slots to be booked again
CREATE UNIQUE INDEX uq_appointment_active_slot ON APPOINTMENT (
    doctor_id, appt_date, appt_time,
    CASE WHEN status != 'Cancelled' THEN 1 ELSE NULL END
);

CREATE TABLE MEDICINE (
    medicine_id  NUMBER(5) PRIMARY KEY,
    med_name     VARCHAR2(60) NOT NULL UNIQUE,
    manufacturer VARCHAR2(60),
    unit_price   NUMBER(8,2) CHECK (unit_price > 0),
    stock_qty    NUMBER(6) DEFAULT 0 CHECK (stock_qty >= 0)
);

CREATE TABLE PRESCRIPTION (
    presc_id      NUMBER(8) PRIMARY KEY,
    appt_id       NUMBER(7) NOT NULL,
    medicine_id   NUMBER(5) NOT NULL,
    dosage        VARCHAR2(60) DEFAULT 'As prescribed',
    duration_days NUMBER(3) CHECK (duration_days > 0),
    quantity      NUMBER(4) CHECK (quantity > 0),
    CONSTRAINT fk_presc_appt FOREIGN KEY (appt_id) REFERENCES APPOINTMENT(appt_id),
    CONSTRAINT fk_presc_medicine FOREIGN KEY (medicine_id) REFERENCES MEDICINE(medicine_id)
);

CREATE TABLE BILL (
    bill_id             NUMBER(8) PRIMARY KEY,
    appt_id             NUMBER(7) NOT NULL UNIQUE,
    consultation_charge NUMBER(9,2) DEFAULT 0 CHECK (consultation_charge >= 0),
    medicine_charge     NUMBER(9,2) DEFAULT 0 CHECK (medicine_charge >= 0),
    total_amount        NUMBER(10,2) CHECK (total_amount >= 0),
    payment_status      VARCHAR2(10) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending')),
    bill_date           DATE DEFAULT SYSDATE,
    CONSTRAINT fk_bill_appt FOREIGN KEY (appt_id) REFERENCES APPOINTMENT(appt_id)
);

-- ----------------------------------------------------------------------------
-- 3. AUTOINCREMENT TRIGGERS (Auto-populate PK from sequences if null)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_dept_bi
BEFORE INSERT ON DEPARTMENT FOR EACH ROW
BEGIN
    IF :NEW.dept_id IS NULL THEN
        SELECT dept_seq.NEXTVAL INTO :NEW.dept_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_doctor_bi
BEFORE INSERT ON DOCTOR FOR EACH ROW
BEGIN
    IF :NEW.doctor_id IS NULL THEN
        SELECT doctor_seq.NEXTVAL INTO :NEW.doctor_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_patient_bi
BEFORE INSERT ON PATIENT FOR EACH ROW
BEGIN
    IF :NEW.patient_id IS NULL THEN
        SELECT patient_seq.NEXTVAL INTO :NEW.patient_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_appt_bi
BEFORE INSERT ON APPOINTMENT FOR EACH ROW
BEGIN
    IF :NEW.appt_id IS NULL THEN
        SELECT appt_seq.NEXTVAL INTO :NEW.appt_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_medicine_bi
BEFORE INSERT ON MEDICINE FOR EACH ROW
BEGIN
    IF :NEW.medicine_id IS NULL THEN
        SELECT medicine_seq.NEXTVAL INTO :NEW.medicine_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_presc_bi
BEFORE INSERT ON PRESCRIPTION FOR EACH ROW
BEGIN
    IF :NEW.presc_id IS NULL THEN
        SELECT presc_seq.NEXTVAL INTO :NEW.presc_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_bill_bi
BEFORE INSERT ON BILL FOR EACH ROW
BEGIN
    IF :NEW.bill_id IS NULL THEN
        SELECT bill_seq.NEXTVAL INTO :NEW.bill_id FROM dual;
    END IF;
END;
/

PROMPT Schema created successfully.
