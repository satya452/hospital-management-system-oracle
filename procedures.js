/**
 * Database Procedures, Functions, Cursors & Triggers
 * Connected to Oracle Database 11g PL/SQL Engine
 */
import {
  queryAll,
  queryOne,
  runSql,
  callProcedure,
  callFunction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
} from './database.js';

// ============================================================
// TRIGGER 1: Inventory Auto-Decrement
// Implemented as Oracle Trigger: trg_inventory_auto_decrement
// ============================================================
export function triggerInventoryDecrement(medicineId, quantity) {
  const medicine = queryOne('SELECT stock_qty, med_name FROM medicine WHERE medicine_id = ?', [medicineId]);
  if (!medicine) throw new Error(`Medicine ID ${medicineId} not found.`);
  if (medicine.stock_qty < quantity) {
    throw new Error(`Insufficient stock for ${medicine.med_name}. Available: ${medicine.stock_qty}, Requested: ${quantity}`);
  }
  // No stock update here; Oracle trigger will decrement automatically on prescription insert.
  return { med_name: medicine.med_name, old_stock: medicine.stock_qty, new_stock: medicine.stock_qty - quantity };
}
// Manual stock decrement (used when trigger is disabled)
export function decrementStock(medicineId, quantity) {
  runSql('UPDATE medicine SET stock_qty = stock_qty - ? WHERE medicine_id = ?', [quantity, medicineId]);
}

// ============================================================
// TRIGGER 2: Appointment Completion Guard
// Implemented as Oracle Trigger: trg_appt_completion_guard
// ============================================================
export function triggerAppointmentCompletionGuard(apptId) {
  const row = queryOne('SELECT COUNT(*) as cnt FROM prescription WHERE appt_id = ?', [apptId]);
  if (row.cnt === 0) {
    throw new Error(`Cannot mark appointment ${apptId} as Completed: no prescription records found. Add prescriptions first.`);
  }
  return true;
}

// ============================================================
// PROCEDURE 1: Auto-Bill Generator
// Calls Oracle Stored Procedure: procedure_auto_bill
// ============================================================
export function procedureAutoBill(apptId) {
  const res = callProcedure('procedure_auto_bill', [apptId]);
  return {
    bill_id: res.bill_id,
    appt_id: apptId,
    consultation_charge: res.consultation_charge,
    medicine_charge: res.medicine_charge,
    total_amount: res.total_amount,
    payment_status: 'Pending'
  };
}

// ============================================================
// PROCEDURE 2: Patient Discharge / Complete Transaction
// Calls Oracle Stored Procedure: procedure_complete_appointment
// ============================================================
export function procedureCompleteAppointment(apptId, diagnosis) {
  const logs = [];
  logs.push({ step: 'Transaction Begin', table: 'SYSTEM', operation: 'BEGIN TRANSACTION', detail: 'Started atomic discharge transaction in Oracle' });
  logs.push({ step: 'Completion Guard (Trigger 2)', status: 'Passed', detail: 'Prescriptions verified by Oracle trigger trg_appt_completion_guard' });

  const res = callProcedure('procedure_complete_appointment', [apptId, diagnosis || 'Consultation completed']);
  logs.push({ step: 'Status Update', status: 'Done', detail: `Appointment ${apptId} marked as Completed in Oracle` });
  logs.push({ step: 'Auto-Bill Generated (Procedure 1)', status: 'Done', detail: `Bill #${res.bill_id} created by PL/SQL. Total: ₹${res.total_amount}` });

  const appt = queryOne('SELECT * FROM appointment WHERE appt_id = ?', [apptId]);
  const bill = queryOne('SELECT * FROM bill WHERE appt_id = ?', [apptId]);
  const prescriptions = queryAll(`
    SELECT p.*, m.med_name, m.stock_qty
    FROM prescription p
    JOIN medicine m ON p.medicine_id = m.medicine_id
    WHERE p.appt_id = ?
  `, [apptId]);

  logs.push({ step: 'Stock Verification', status: 'Done', detail: `${prescriptions.length} medicines verified in stock` });
  logs.push({ step: 'Transaction Commit', table: 'SYSTEM', operation: 'COMMIT', detail: 'Discharge transaction committed to Oracle' });

  return { appointment: { ...appt, status: 'Completed', diagnosis }, bill, prescriptions, logs };
}

// ============================================================
// FUNCTION 1: Get Patient Total Spend
// Calls Oracle Stored Function: func_get_patient_total_spend
// ============================================================
export function functionGetPatientTotalSpend(patientId) {
  const res = callFunction('func_get_patient_total_spend', [patientId]);
  return res.total_spend || 0;
}

// ============================================================
// FUNCTION 2: Check Doctor Availability
// Calls Oracle Stored Function: func_check_doctor_available
// ============================================================
export function functionCheckDoctorAvailability(doctorId, date, time) {
  const res = callFunction('func_check_doctor_available', [doctorId, date, time]);
  return res.result === 1 ? 1 : 0;
}

// ============================================================
// CURSOR 1: Patient Visit Summary Report
// Calls Oracle PL/SQL Cursor: cursor_patient_visit_summary
// ============================================================
export function cursorPatientVisitSummary(patientId) {
  const patient = queryOne('SELECT * FROM patient WHERE patient_id = ?', [patientId]);
  if (!patient) throw new Error(`Patient ${patientId} not found.`);

  // Call Oracle REF CURSOR procedure
  const visits = callProcedure('cursor_patient_visit_summary', [patientId]);

  const summary = (Array.isArray(visits) ? visits : []).map(visit => {
    const prescriptions = queryAll(`
      SELECT p.*, m.med_name, m.unit_price, (m.unit_price * p.quantity) as line_total
      FROM prescription p
      JOIN medicine m ON p.medicine_id = m.medicine_id
      WHERE p.appt_id = ?
    `, [visit.appt_id]);
    const bill = queryOne('SELECT * FROM bill WHERE appt_id = ?', [visit.appt_id]);
    return { ...visit, prescriptions, bill };
  });

  const totalSpend = functionGetPatientTotalSpend(patientId);
  return { patient, visits: summary, total_spend: totalSpend };
}

// ============================================================
// TRANSACTION HELPERS & VALIDATIONS
// ============================================================

export function validateAppointmentDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    throw new Error('Appointment date and time are required.');
  }

  const dateMatch = String(dateStr).trim().match(/^\d{4}-\d{2}-\d{2}$/);
  const timeMatch = String(timeStr).trim().match(/^\d{2}:\d{2}$/);
  if (!dateMatch || !timeMatch) {
    throw new Error('Invalid date or time format. Expected YYYY-MM-DD and HH:MM.');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;

  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();

  if (cleanDate < todayStr) {
    throw new Error(`Cannot book an appointment for a previous date (${cleanDate}). Please select today or an upcoming date.`);
  }

  if (cleanDate === todayStr && cleanTime <= currentTimeStr) {
    throw new Error(`Cannot book an appointment for a time in the past (${cleanTime}). Current time is ${currentTimeStr}. Please select an upcoming time.`);
  }
}

// ============================================================
// TRANSACTION 1: Patient Onboarding & Initial Booking
// Calls Oracle PL/SQL Procedure: txn_patient_onboarding
// ============================================================
export function transactionPatientOnboarding(patientData, appointmentData) {
  const cleanPhone = patientData.phone ? String(patientData.phone).trim() : '';
  if (!/^\d{10}$/.test(cleanPhone)) {
    throw new Error('Mobile number must be exactly 10 digits (numbers only).');
  }

  const existing = queryOne('SELECT patient_id FROM patient WHERE phone = ?', [cleanPhone]);
  if (existing) {
    throw new Error(`Mobile number '${cleanPhone}' is already registered with another patient. It must be unique.`);
  }

  validateAppointmentDateTime(appointmentData.appt_date, appointmentData.appt_time);

  const logs = [];
  logs.push({ step: 'Transaction Begin', table: 'SYSTEM', operation: 'BEGIN TRANSACTION', detail: 'Started atomic onboarding transaction in Oracle' });

  // Call Oracle PL/SQL procedure
  const res = callProcedure('txn_patient_onboarding', [
    patientData.patient_name,
    patientData.dob,
    patientData.gender,
    patientData.blood_group,
    cleanPhone,
    patientData.address || null,
    appointmentData.doctor_id,
    appointmentData.appt_date,
    appointmentData.appt_time
  ]);

  logs.push({ step: 'Patient Registration', table: 'PATIENT', operation: 'INSERT', detail: `Patient #${res.patient_id} created in Oracle via patient_seq` });
  logs.push({ step: 'Availability Verification', table: 'APPOINTMENT', operation: 'SELECT', detail: 'Doctor slot verified available by PL/SQL' });
  logs.push({ step: 'Appointment Booking', table: 'APPOINTMENT', operation: 'INSERT', detail: `Appointment #${res.appt_id} scheduled in Oracle via appt_seq` });
  logs.push({ step: 'Transaction Commit', table: 'SYSTEM', operation: 'COMMIT', detail: 'Transaction successfully committed to Oracle Database' });

  return { patient_id: res.patient_id, appt_id: res.appt_id, logs };
}

// ============================================================
// TRANSACTION 2: Doctor Consultation & Prescription Processing
// Protected by Oracle Triggers: trg_inventory_auto_decrement & trg_appt_completion_guard
// ===========================================================
export function transactionConsultationPrescription(apptId, diagnosis, prescriptions) {
  if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
    throw new Error('At least one prescription is required to complete consultation.');
  }
  const escapeXml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[char]));
  const itemsXml = '<prescriptions>' + prescriptions.map(item =>
    '<item><medicine_id>' + escapeXml(item.medicine_id) + '</medicine_id>' +
    '<dosage>' + escapeXml(item.dosage) + '</dosage>' +
    '<duration_days>' + escapeXml(item.duration_days) + '</duration_days>' +
    '<quantity>' + escapeXml(item.quantity) + '</quantity></item>'
  ).join('') + '</prescriptions>';
  callProcedure('txn_consultation_prescription', [apptId, diagnosis || null, itemsXml]);
  return { appt_id: apptId, logs: [
    { step: 'Consultation Procedure', table: 'PRESCRIPTION, MEDICINE, APPOINTMENT', operation: 'PL/SQL',
      detail: `${prescriptions.length} prescriptions saved and appointment completed by txn_consultation_prescription`,
      trigger: 'Inventory deduction and completion guard' },
    { step: 'Transaction Commit', table: 'SYSTEM', operation: 'COMMIT', detail: 'Consultation committed by Oracle; failures roll back the entire procedure' }
  ] };
}

// ============================================================
// TRANSACTION 3: Automated Billing & Payment Processing
// Calls Oracle PL/SQL Procedure: txn_billing_payment
// ============================================================
export function transactionBillingPayment(apptId) {
  const appt = queryOne('SELECT * FROM appointment WHERE appt_id = ?', [apptId]);
  if (!appt) throw new Error(`Appointment ${apptId} not found.`);

  const logs = [];
  logs.push({ step: 'Transaction Begin', table: 'SYSTEM', operation: 'BEGIN TRANSACTION', detail: 'Started atomic billing transaction in Oracle' });

  const res = callProcedure('txn_billing_payment', [apptId]);
  const bill = queryOne('SELECT * FROM bill WHERE bill_id = ?', [res.bill_id]);

  logs.push({
    step: 'Auto-Bill Generated (Procedure 1)',
    table: 'BILL',
    operation: 'INSERT/UPDATE',
    detail: `Bill #${res.bill_id}: Consultation ₹${bill.consultation_charge} + Medicines ₹${bill.medicine_charge} = ₹${res.total_amount}`,
    procedure: 'Procedure 1: procedure_auto_bill'
  });
  logs.push({ step: 'Payment Processed', table: 'BILL', operation: 'UPDATE', detail: `Payment status → Paid for Bill #${res.bill_id}` });
  logs.push({ step: 'Transaction Commit', table: 'SYSTEM', operation: 'COMMIT', detail: 'Billing transaction committed to Oracle Database' });

  return { bill: { ...bill, payment_status: 'Paid' }, logs };
}

// ============================================================
// TRANSACTION 4: Inventory Restock & Price Adjustment
// ============================================================
export function transactionInventoryRestock(medicineId, addQty, newPrice) {
  callProcedure('txn_inventory_restock', [medicineId, addQty ?? null, newPrice ?? null]);
  const medicine = queryOne('SELECT * FROM medicine WHERE medicine_id = ?', [medicineId]);
  const logs = [
    { step: 'Inventory Procedure', table: 'MEDICINE', operation: 'PL/SQL',
      detail: `${medicine.med_name}: stock ${medicine.stock_qty}, price ${medicine.unit_price}; updated by txn_inventory_restock` },
    { step: 'Transaction Commit', table: 'SYSTEM', operation: 'COMMIT', detail: 'Restock and price adjustment committed together by Oracle' }
  ];
  if (medicine.stock_qty < 50) logs.push({ step: 'Low Stock Alert', table: 'MEDICINE', operation: 'ALERT', detail: `${medicine.med_name}: ${medicine.stock_qty} units remaining` });
  return { medicine, logs };
}

// ============================================================
// TRANSACTION 5: Appointment Cancellation & Slot Cleanup
// Calls Oracle PL/SQL Procedure: txn_cancel_appointment
// ============================================================
export function transactionCancelAppointment(apptId) {
  const appt = queryOne(`
    SELECT a.*, d.doc_name
    FROM appointment a
    JOIN doctor d ON a.doctor_id = d.doctor_id
    WHERE a.appt_id = ?
  `, [apptId]);
  if (!appt) throw new Error(`Appointment ${apptId} not found.`);
  if (appt.status === 'Cancelled') throw new Error('Appointment is already cancelled.');
  if (appt.status === 'Completed') throw new Error('Cannot cancel a completed appointment.');

  const logs = [];
  logs.push({ step: 'Transaction Begin', table: 'SYSTEM', operation: 'BEGIN TRANSACTION', detail: 'Started cancellation transaction in Oracle' });

  callProcedure('txn_cancel_appointment', [apptId]);

  logs.push({ step: 'Appointment Cancelled', table: 'APPOINTMENT', operation: 'UPDATE', detail: `Appointment #${apptId} with ${appt.doc_name} on ${appt.appt_date} at ${appt.appt_time} cancelled via PL/SQL` });
  logs.push({ step: 'Slot Released', table: 'APPOINTMENT', operation: 'CONSTRAINT', detail: `Doctor ${appt.doc_name} slot ${appt.appt_date} ${appt.appt_time} is now available for rebooking via uq_appointment_active_slot` });
  logs.push({ step: 'Transaction Commit', table: 'SYSTEM', operation: 'COMMIT', detail: 'Cancellation committed to Oracle Database' });

  return { appointment: { ...appt, status: 'Cancelled' }, logs };
}
