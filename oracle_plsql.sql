-- ============================================================================
-- BCSE302L Database Systems Course Project: Hospital Management System (HMS)
-- PL/SQL Procedures, Functions, Cursors, and Triggers
-- Target: Oracle Database 11g
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Inventory Auto-Decrement
-- Automatically decrements stock on prescription and raises error if insufficient
-- ============================================================================
CREATE OR REPLACE TRIGGER trg_inventory_auto_decrement
BEFORE INSERT ON PRESCRIPTION FOR EACH ROW
DECLARE
    v_stock NUMBER;
    v_name  VARCHAR2(60);
BEGIN
    SELECT stock_qty, med_name INTO v_stock, v_name
    FROM MEDICINE
    WHERE medicine_id = :NEW.medicine_id
    FOR UPDATE;

    IF v_stock < :NEW.quantity THEN
        RAISE_APPLICATION_ERROR(-20001, 'Insufficient stock for ' || v_name || '. Available: ' || v_stock || ', Requested: ' || :NEW.quantity);
    END IF;

    UPDATE MEDICINE
    SET stock_qty = stock_qty - :NEW.quantity
    WHERE medicine_id = :NEW.medicine_id;
END;
/

-- ============================================================================
-- TRIGGER 2: Appointment Completion Guard
-- Prevents updating appointment status to 'Completed' unless prescription exists
-- ============================================================================
CREATE OR REPLACE TRIGGER trg_appt_completion_guard
BEFORE UPDATE OF status ON APPOINTMENT FOR EACH ROW
DECLARE
    v_count NUMBER;
BEGIN
    IF :NEW.status = 'Completed' AND :OLD.status != 'Completed' THEN
        SELECT COUNT(*) INTO v_count
        FROM PRESCRIPTION
        WHERE appt_id = :NEW.appt_id;

        IF v_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Cannot mark appointment ' || :NEW.appt_id || ' as Completed: no prescription records found. Add prescriptions first.');
        END IF;
    END IF;
END;
/

-- ============================================================================
-- FUNCTION 1: Get Patient Total Spend
-- Computes aggregate lifetime spending across all bills for a given patient
-- ============================================================================
CREATE OR REPLACE FUNCTION func_get_patient_total_spend(p_patient_id IN NUMBER)
RETURN NUMBER
IS
    v_total NUMBER := 0;
BEGIN
    SELECT COALESCE(SUM(b.total_amount), 0) INTO v_total
    FROM BILL b
    JOIN APPOINTMENT a ON b.appt_id = a.appt_id
    WHERE a.patient_id = p_patient_id;

    RETURN v_total;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

-- ============================================================================
-- FUNCTION 2: Check Doctor Availability
-- Returns 1 if slot is free (no non-cancelled appointment), 0 if booked
-- ============================================================================
CREATE OR REPLACE FUNCTION func_check_doctor_available(
    p_doctor_id IN NUMBER,
    p_appt_date IN DATE,
    p_appt_time IN VARCHAR2
)
RETURN NUMBER
IS
    v_count NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM APPOINTMENT
    WHERE doctor_id = p_doctor_id
      AND TRUNC(appt_date) = TRUNC(p_appt_date)
      AND appt_time = p_appt_time
      AND status != 'Cancelled';

    IF v_count = 0 THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END;
/

-- ============================================================================
-- PROCEDURE 1: Auto-Bill Generator
-- Computes consultation fee + sum(unit_price * quantity) and creates/updates BILL
-- ============================================================================
CREATE OR REPLACE PROCEDURE procedure_auto_bill(
    p_appt_id             IN  NUMBER,
    p_bill_id             OUT NUMBER,
    p_consultation_charge OUT NUMBER,
    p_medicine_charge     OUT NUMBER,
    p_total_amount        OUT NUMBER
)
IS
    v_fee        NUMBER := 0;
    v_med_charge NUMBER := 0;
    v_total      NUMBER := 0;
    v_existing   NUMBER := 0;
BEGIN
    -- Get doctor consultation fee
    SELECT d.consultation_fee INTO v_fee
    FROM APPOINTMENT a
    JOIN DOCTOR d ON a.doctor_id = d.doctor_id
    WHERE a.appt_id = p_appt_id;

    -- Calculate medicine charges
    SELECT COALESCE(SUM(m.unit_price * p.quantity), 0) INTO v_med_charge
    FROM PRESCRIPTION p
    JOIN MEDICINE m ON p.medicine_id = m.medicine_id
    WHERE p.appt_id = p_appt_id;

    v_total := v_fee + v_med_charge;

    -- Check if bill already exists
    SELECT COUNT(*) INTO v_existing FROM BILL WHERE appt_id = p_appt_id;

    IF v_existing > 0 THEN
        UPDATE BILL
        SET consultation_charge = v_fee,
            medicine_charge     = v_med_charge,
            total_amount        = v_total,
            bill_date           = SYSDATE
        WHERE appt_id = p_appt_id
        RETURNING bill_id INTO p_bill_id;
    ELSE
        INSERT INTO BILL (appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date)
        VALUES (p_appt_id, v_fee, v_med_charge, v_total, 'Pending', SYSDATE)
        RETURNING bill_id INTO p_bill_id;
    END IF;

    p_consultation_charge := v_fee;
    p_medicine_charge     := v_med_charge;
    p_total_amount        := v_total;
END;
/

-- ============================================================================
-- PROCEDURE 2: Patient Discharge / Complete Appointment
-- Validates completion guard, updates status to Completed, generates bill
-- ============================================================================
CREATE OR REPLACE PROCEDURE procedure_complete_appointment(
    p_appt_id             IN  NUMBER,
    p_diagnosis           IN  VARCHAR2,
    p_bill_id             OUT NUMBER,
    p_total_amount        OUT NUMBER
)
IS
    v_fee NUMBER;
    v_med NUMBER;
    v_status VARCHAR2(12);
BEGIN
    SELECT status INTO v_status FROM APPOINTMENT WHERE appt_id = p_appt_id;
    IF v_status = 'Completed' THEN
        RAISE_APPLICATION_ERROR(-20003, 'Appointment ' || p_appt_id || ' is already completed.');
    ELSIF v_status = 'Cancelled' THEN
        RAISE_APPLICATION_ERROR(-20004, 'Appointment ' || p_appt_id || ' is cancelled.');
    END IF;

    -- Update appointment (fires Trigger 2: trg_appt_completion_guard)
    UPDATE APPOINTMENT
    SET status = 'Completed',
        diagnosis = p_diagnosis
    WHERE appt_id = p_appt_id;

    -- Generate bill
    procedure_auto_bill(p_appt_id, p_bill_id, v_fee, v_med, p_total_amount);
END;
/

-- ============================================================================
-- CURSOR 1: Patient Visit Summary Report
-- Returns SYS_REFCURSOR for clinical history breakdown of visits, meds, and bills
-- ============================================================================
CREATE OR REPLACE PROCEDURE cursor_patient_visit_summary(
    p_patient_id IN  NUMBER,
    p_cursor     OUT SYS_REFCURSOR
)
IS
BEGIN
    OPEN p_cursor FOR
        SELECT a.appt_id,
               TO_CHAR(a.appt_date, 'YYYY-MM-DD') AS appt_date,
               a.appt_time,
               d.doc_name,
               d.specialization,
               dep.dept_name,
               a.status,
               a.diagnosis,
               COALESCE(b.total_amount, 0) AS bill_total,
               COALESCE(b.payment_status, 'N/A') AS payment_status
        FROM APPOINTMENT a
        JOIN DOCTOR d ON a.doctor_id = d.doctor_id
        JOIN DEPARTMENT dep ON d.dept_id = dep.dept_id
        LEFT JOIN BILL b ON a.appt_id = b.appt_id
        WHERE a.patient_id = p_patient_id
        ORDER BY a.appt_date DESC, a.appt_time DESC;
END;
/

-- ============================================================================
-- TRANSACTION 1: Patient Onboarding & Initial Booking
-- ============================================================================
CREATE OR REPLACE PROCEDURE txn_patient_onboarding(
    p_patient_name IN  VARCHAR2,
    p_dob          IN  DATE,
    p_gender       IN  CHAR,
    p_blood_group  IN  VARCHAR2,
    p_phone        IN  VARCHAR2,
    p_address      IN  VARCHAR2,
    p_doctor_id    IN  NUMBER,
    p_appt_date    IN  DATE,
    p_appt_time    IN  VARCHAR2,
    p_patient_id   OUT NUMBER,
    p_appt_id      OUT NUMBER
)
IS
    v_available NUMBER;
BEGIN
    -- Check availability
    v_available := func_check_doctor_available(p_doctor_id, p_appt_date, p_appt_time);
    IF v_available = 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Doctor is not available at the selected date/time slot.');
    END IF;

    -- Insert patient
    INSERT INTO PATIENT (patient_name, dob, gender, blood_group, phone, address, registered_date)
    VALUES (p_patient_name, p_dob, p_gender, p_blood_group, p_phone, p_address, SYSDATE)
    RETURNING patient_id INTO p_patient_id;

    -- Insert appointment
    INSERT INTO APPOINTMENT (patient_id, doctor_id, appt_date, appt_time, status)
    VALUES (p_patient_id, p_doctor_id, p_appt_date, p_appt_time, 'Scheduled')
    RETURNING appt_id INTO p_appt_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- ============================================================================
-- TRANSACTION 2: Consultation & Prescription Processing
-- One XML item per medicine; Oracle 11g XMLTABLE supports multiple prescriptions.
-- Inventory and completion rules are enforced by the existing database triggers.
-- ============================================================================
CREATE OR REPLACE PROCEDURE txn_consultation_prescription(
    p_appt_id IN NUMBER,
    p_diagnosis IN VARCHAR2,
    p_items_xml IN CLOB
)
IS
    v_status APPOINTMENT.status%TYPE;
    v_count NUMBER := 0;
BEGIN
    SELECT status INTO v_status FROM APPOINTMENT
    WHERE appt_id = p_appt_id FOR UPDATE;
    IF v_status != 'Scheduled' THEN
        RAISE_APPLICATION_ERROR(-20008, 'Appointment must be Scheduled.');
    END IF;
    IF p_items_xml IS NULL THEN
        RAISE_APPLICATION_ERROR(-20009, 'At least one prescription is required.');
    END IF;
    FOR item IN (
        SELECT medicine_id, dosage, duration_days, quantity
        FROM XMLTABLE('/prescriptions/item' PASSING XMLTYPE(p_items_xml)
            COLUMNS medicine_id NUMBER PATH 'medicine_id',
                    dosage VARCHAR2(60) PATH 'dosage',
                    duration_days NUMBER PATH 'duration_days',
                    quantity NUMBER PATH 'quantity')
    ) LOOP
        IF item.medicine_id IS NULL OR item.quantity IS NULL
           OR item.quantity <= 0 OR item.quantity != TRUNC(item.quantity)
           OR item.duration_days IS NULL OR item.duration_days <= 0
           OR item.duration_days != TRUNC(item.duration_days) THEN
            RAISE_APPLICATION_ERROR(-20010, 'Medicine, positive whole quantity and duration are required.');
        END IF;
        INSERT INTO PRESCRIPTION (appt_id, medicine_id, dosage, duration_days, quantity)
        VALUES (p_appt_id, item.medicine_id, NVL(item.dosage, 'As prescribed'), item.duration_days, item.quantity);
        v_count := v_count + 1;
    END LOOP;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20009, 'At least one prescription is required.');
    END IF;
    UPDATE APPOINTMENT SET status = 'Completed', diagnosis = p_diagnosis
    WHERE appt_id = p_appt_id;
    COMMIT;
EXCEPTION WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/

-- ============================================================================
-- TRANSACTION 3: Automated Billing & Payment Processing
-- ============================================================================
CREATE OR REPLACE PROCEDURE txn_billing_payment(
    p_appt_id      IN  NUMBER,
    p_bill_id      OUT NUMBER,
    p_total_amount OUT NUMBER
)
IS
    v_fee NUMBER;
    v_med NUMBER;
BEGIN
    procedure_auto_bill(p_appt_id, p_bill_id, v_fee, v_med, p_total_amount);

    UPDATE BILL
    SET payment_status = 'Paid'
    WHERE bill_id = p_bill_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- ============================================================================
-- TRANSACTION 4: Inventory Restock & Price Adjustment
-- Stock and price changes succeed together or are rolled back together.
-- ============================================================================
CREATE OR REPLACE PROCEDURE txn_inventory_restock(
    p_medicine_id IN NUMBER,
    p_add_qty IN NUMBER,
    p_new_price IN NUMBER
)
IS
    v_stock MEDICINE.stock_qty%TYPE;
BEGIN
    IF p_add_qty IS NOT NULL AND (p_add_qty < 0 OR p_add_qty != TRUNC(p_add_qty)) THEN
        RAISE_APPLICATION_ERROR(-20011, 'Restock quantity must be a non-negative whole number.');
    END IF;
    IF p_new_price IS NOT NULL AND p_new_price <= 0 THEN
        RAISE_APPLICATION_ERROR(-20012, 'New price must be positive.');
    END IF;
    IF NVL(p_add_qty, 0) = 0 AND p_new_price IS NULL THEN
        RAISE_APPLICATION_ERROR(-20013, 'Provide a restock quantity or a new price.');
    END IF;
    SELECT stock_qty INTO v_stock FROM MEDICINE
    WHERE medicine_id = p_medicine_id FOR UPDATE;
    UPDATE MEDICINE
    SET stock_qty = stock_qty + NVL(p_add_qty, 0),
        unit_price = NVL(p_new_price, unit_price)
    WHERE medicine_id = p_medicine_id;
    COMMIT;
EXCEPTION WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/

-- ============================================================================
-- TRANSACTION 5: Appointment Cancellation & Slot Cleanup
-- ============================================================================
CREATE OR REPLACE PROCEDURE txn_cancel_appointment(
    p_appt_id IN NUMBER
)
IS
    v_status VARCHAR2(12);
BEGIN
    SELECT status INTO v_status FROM APPOINTMENT WHERE appt_id = p_appt_id;
    IF v_status = 'Cancelled' THEN
        RAISE_APPLICATION_ERROR(-20006, 'Appointment ' || p_appt_id || ' is already cancelled.');
    ELSIF v_status = 'Completed' THEN
        RAISE_APPLICATION_ERROR(-20007, 'Cannot cancel a completed appointment.');
    END IF;

    UPDATE APPOINTMENT
    SET status = 'Cancelled'
    WHERE appt_id = p_appt_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

PROMPT PL/SQL Procedures, Functions, and Triggers compiled successfully.
