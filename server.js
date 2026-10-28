import express from 'express';
import cors from 'cors';
import { initializeDatabase, queryAll, queryOne, runSql, saveDb, syncTableSequence, syncAllSequences, beginTransaction, commitTransaction, rollbackTransaction } from './database.js';
import {
  procedureAutoBill,
  procedureCompleteAppointment,
  functionGetPatientTotalSpend,
  functionCheckDoctorAvailability,
  cursorPatientVisitSummary,
  triggerInventoryDecrement,
  transactionPatientOnboarding,
  transactionConsultationPrescription,
  transactionBillingPayment,
  transactionInventoryRestock,
  transactionCancelAppointment,
  validateAppointmentDateTime,
} from './procedures.js';

const app = express();
app.use(cors());
app.use(express.json());

// ===================== DASHBOARD =====================
app.get('/api/dashboard', (req, res) => {
  try {
    const totalPatients = queryOne('SELECT COUNT(*) as count FROM patient')?.count || 0;
    const appointmentsToday = queryOne("SELECT COUNT(*) as count FROM appointment WHERE appt_date = date('now')")?.count || 0;
    const totalRevenue = queryOne("SELECT COALESCE(SUM(total_amount), 0) as total FROM bill WHERE payment_status = 'Paid'")?.total || 0;
    const lowStockMeds = queryOne('SELECT COUNT(*) as count FROM medicine WHERE stock_qty < 50')?.count || 0;
    const totalDoctors = queryOne('SELECT COUNT(*) as count FROM doctor')?.count || 0;
    const pendingBills = queryOne("SELECT COUNT(*) as count FROM bill WHERE payment_status = 'Pending'")?.count || 0;
    const scheduledAppts = queryOne("SELECT COUNT(*) as count FROM appointment WHERE status = 'Scheduled'")?.count || 0;
    const completedAppts = queryOne("SELECT COUNT(*) as count FROM appointment WHERE status = 'Completed'")?.count || 0;

    // Revenue by department
    const revenueByDept = queryAll(`
      SELECT dep.dept_name, COALESCE(SUM(b.total_amount), 0) as revenue
      FROM department dep
      LEFT JOIN doctor d ON dep.dept_id = d.dept_id
      LEFT JOIN appointment a ON d.doctor_id = a.doctor_id
      LEFT JOIN bill b ON a.appt_id = b.appt_id AND b.payment_status = 'Paid'
      GROUP BY dep.dept_id, dep.dept_name
      HAVING COALESCE(SUM(b.total_amount), 0) > 0
      ORDER BY revenue DESC
    `);

    // Monthly appointments
    const monthlyAppts = queryAll(`
      SELECT substr(appt_date, 1, 7) as month, COUNT(*) as count
      FROM appointment
      GROUP BY substr(appt_date, 1, 7)
      ORDER BY month
    `);

    // Top 5 prescribed medicines
    const topMedicines = queryAll(`
      SELECT m.med_name, SUM(p.quantity) as total_qty, COUNT(*) as prescription_count
      FROM prescription p
      JOIN medicine m ON p.medicine_id = m.medicine_id
      GROUP BY m.medicine_id, m.med_name
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    // Recent appointments
    const recentAppointments = queryAll(`
      SELECT a.*, p.patient_name, d.doc_name
      FROM appointment a
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      ORDER BY a.appt_date DESC, a.appt_time DESC
      LIMIT 5
    `);

    res.json({
      cards: { totalPatients, appointmentsToday, totalRevenue, lowStockMeds, totalDoctors, pendingBills, scheduledAppts, completedAppts },
      revenueByDept,
      monthlyAppts,
      topMedicines,
      recentAppointments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== PATIENTS =====================
app.get('/api/patients', (req, res) => {
  try {
    const { search } = req.query;
    let patients;
    if (search) {
      patients = queryAll(`
        SELECT * FROM patient
        WHERE patient_name LIKE ? OR phone LIKE ? OR CAST(patient_id AS TEXT) LIKE ?
        ORDER BY registered_date DESC
      `, [`%${search}%`, `%${search}%`, `%${search}%`]);
    } else {
      patients = queryAll('SELECT * FROM patient ORDER BY registered_date DESC');
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = queryOne('SELECT * FROM patient WHERE patient_id = ?', [req.params.id]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', (req, res) => {
  try {
    const { patient_name, dob, gender, blood_group, phone, address } = req.body;
    const cleanPhone = phone ? String(phone).trim() : '';

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits (numbers only).' });
    }

    const existing = queryOne('SELECT patient_id FROM patient WHERE phone = ?', [cleanPhone]);
    if (existing) {
      return res.status(400).json({ error: 'Mobile number is already registered. It must be unique.' });
    }

    const result = runSql(`
      INSERT INTO patient (patient_name, dob, gender, blood_group, phone, address, registered_date)
      VALUES (?, ?, ?, ?, ?, ?, date('now'))
    `, [patient_name, dob, gender, blood_group, cleanPhone, address]);
    saveDb();
    res.status(201).json({ patient_id: result.lastInsertRowid, message: 'Patient registered successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Mobile number is already registered. It must be unique.' });
    }
    if (err.message && err.message.includes('CHECK')) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits (numbers only).' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', (req, res) => {
  try {
    const { patient_name, dob, gender, blood_group, phone, address } = req.body;
    const cleanPhone = phone ? String(phone).trim() : '';

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits (numbers only).' });
    }

    const existing = queryOne('SELECT patient_id FROM patient WHERE phone = ? AND patient_id != ?', [cleanPhone, req.params.id]);
    if (existing) {
      return res.status(400).json({ error: 'Mobile number is already registered by another patient. It must be unique.' });
    }

    runSql(`
      UPDATE patient SET patient_name=?, dob=?, gender=?, blood_group=?, phone=?, address=?
      WHERE patient_id=?
    `, [patient_name, dob, gender, blood_group, cleanPhone, address, req.params.id]);
    saveDb();
    res.json({ message: 'Patient updated successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Mobile number is already registered. It must be unique.' });
    }
    if (err.message && err.message.includes('CHECK')) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits (numbers only).' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id/history', (req, res) => {
  try {
    const summary = cursorPatientVisitSummary(parseInt(req.params.id));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const patient = queryOne('SELECT * FROM patient WHERE patient_id = ?', [id]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const appts = queryAll('SELECT appt_id FROM appointment WHERE patient_id = ?', [id]);
    if (appts.length > 0) {
      return res.status(400).json({
        error: `Cannot delete patient #${id} because ${appts.length} appointment record(s) exist for this patient.`
      });
    }

    runSql('DELETE FROM patient WHERE patient_id = ?', [id]);
    syncTableSequence('patient');
    saveDb();
    res.json({ message: `Patient #${id} (${patient.patient_name}) deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== DEPARTMENTS =====================
app.get('/api/departments', (req, res) => {
  try {
    const depts = queryAll(`
      SELECT d.dept_id, d.dept_name, d.location, d.phone,
        (SELECT COUNT(*) FROM doctor doc WHERE doc.dept_id = d.dept_id) AS doctor_count
      FROM department d
      ORDER BY d.dept_name
    `);
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', (req, res) => {
  try {
    const { dept_name, location, phone } = req.body;
    const result = runSql('INSERT INTO department (dept_name, location, phone) VALUES (?, ?, ?)', [dept_name, location, phone]);
    saveDb();
    res.status(201).json({ dept_id: result.lastInsertRowid, message: 'Department created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== DOCTORS =====================
app.get('/api/doctors', (req, res) => {
  try {
    const { specialization, dept_id } = req.query;
    let query = `
      SELECT d.*, dep.dept_name
      FROM doctor d
      JOIN department dep ON d.dept_id = dep.dept_id
    `;
    const conditions = [];
    const params = [];
    if (specialization) { conditions.push('d.specialization LIKE ?'); params.push(`%${specialization}%`); }
    if (dept_id) { conditions.push('d.dept_id = ?'); params.push(dept_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY d.doc_name';

    const doctors = queryAll(query, params);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', (req, res) => {
  try {
    const { doc_name, specialization, phone, email, consultation_fee, dept_id } = req.body;
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanEmail = email ? String(email).trim() : '';

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits (numbers only).' });
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Email must be valid and contain an @ symbol (e.g. name@domain.com).' });
    }

    const existingPhone = queryOne('SELECT doctor_id FROM doctor WHERE phone = ?', [cleanPhone]);
    if (existingPhone) {
      return res.status(400).json({ error: 'Mobile number is already registered. It must be unique.' });
    }

    const existingEmail = queryOne('SELECT doctor_id FROM doctor WHERE email = ?', [cleanEmail]);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email address is already registered. It must be unique.' });
    }

    const result = runSql(`
      INSERT INTO doctor (doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id)
      VALUES (?, ?, ?, ?, ?, date('now'), ?)
    `, [doc_name, specialization, cleanPhone, cleanEmail, consultation_fee || 500, dept_id]);
    saveDb();
    res.status(201).json({ doctor_id: result.lastInsertRowid, message: 'Doctor added successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Mobile number or email already registered. It must be unique.' });
    }
    if (err.message && err.message.includes('CHECK')) {
      return res.status(400).json({ error: 'Validation constraint failed: ensure 10-digit phone and valid email with @ symbol.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctors/:id', (req, res) => {
  try {
    const { doc_name, specialization, phone, email, consultation_fee, dept_id } = req.body;
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanEmail = email ? String(email).trim() : '';

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits (numbers only).' });
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Email must be valid and contain an @ symbol (e.g. name@domain.com).' });
    }

    const existingPhone = queryOne('SELECT doctor_id FROM doctor WHERE phone = ? AND doctor_id != ?', [cleanPhone, req.params.id]);
    if (existingPhone) {
      return res.status(400).json({ error: 'Mobile number is already registered by another doctor. It must be unique.' });
    }

    const existingEmail = queryOne('SELECT doctor_id FROM doctor WHERE email = ? AND doctor_id != ?', [cleanEmail, req.params.id]);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email address is already registered by another doctor. It must be unique.' });
    }

    runSql(`
      UPDATE doctor SET doc_name=?, specialization=?, phone=?, email=?, consultation_fee=?, dept_id=?
      WHERE doctor_id=?
    `, [doc_name, specialization, cleanPhone, cleanEmail, consultation_fee, dept_id, req.params.id]);
    saveDb();
    res.json({ message: 'Doctor updated successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Mobile number or email already registered. It must be unique.' });
    }
    if (err.message && err.message.includes('CHECK')) {
      return res.status(400).json({ error: 'Validation constraint failed: ensure 10-digit phone and valid email with @ symbol.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/doctors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const doctor = queryOne('SELECT * FROM doctor WHERE doctor_id = ?', [id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const appts = queryAll('SELECT appt_id FROM appointment WHERE doctor_id = ?', [id]);
    if (appts.length > 0) {
      return res.status(400).json({
        error: `Cannot delete doctor #${id} because ${appts.length} appointment record(s) exist for this doctor.`
      });
    }

    runSql('DELETE FROM doctor WHERE doctor_id = ?', [id]);
    syncTableSequence('doctor');
    saveDb();
    res.json({ message: `Doctor #${id} (${doctor.doc_name}) deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctors/:id/availability', (req, res) => {
  try {
    const { date, time } = req.query;
    const available = functionCheckDoctorAvailability(parseInt(req.params.id), date, time);
    res.json({ available: available === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== APPOINTMENTS =====================
app.get('/api/appointments', (req, res) => {
  try {
    const { status, date } = req.query;
    let query = `
      SELECT a.*, p.patient_name, d.doc_name, d.specialization, dep.dept_name
      FROM appointment a
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN department dep ON d.dept_id = dep.dept_id
    `;
    const conditions = [];
    const params = [];
    if (status) { conditions.push('a.status = ?'); params.push(status); }
    if (date) { conditions.push('a.appt_date = ?'); params.push(date); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.appt_date DESC, a.appt_time ASC';

    res.json(queryAll(query, params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/:id', (req, res) => {
  try {
    const appt = queryOne(`
      SELECT a.*, p.patient_name, p.phone as patient_phone, d.doc_name, d.specialization, d.consultation_fee, dep.dept_name
      FROM appointment a
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN department dep ON d.dept_id = dep.dept_id
      WHERE a.appt_id = ?
    `, [req.params.id]);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const { patient_id, doctor_id, appt_date, appt_time } = req.body;
    validateAppointmentDateTime(appt_date, appt_time);

    const available = functionCheckDoctorAvailability(doctor_id, appt_date, appt_time);
    if (!available) return res.status(409).json({ error: 'Doctor is not available at this date/time. Slot already booked.' });

    const result = runSql(`
      INSERT INTO appointment (patient_id, doctor_id, appt_date, appt_time, status)
      VALUES (?, ?, ?, ?, 'Scheduled')
    `, [patient_id, doctor_id, appt_date, appt_time]);
    saveDb();
    res.status(201).json({ appt_id: result.lastInsertRowid, message: 'Appointment scheduled' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/reschedule', (req, res) => {
  try {
    const { appt_date, appt_time } = req.body;
    validateAppointmentDateTime(appt_date, appt_time);

    const appt = queryOne('SELECT * FROM appointment WHERE appt_id = ?', [req.params.id]);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status !== 'Scheduled') return res.status(400).json({ error: 'Only scheduled appointments can be rescheduled' });

    const available = functionCheckDoctorAvailability(appt.doctor_id, appt_date, appt_time);
    if (!available) return res.status(409).json({ error: 'Doctor is not available at the new date/time.' });

    runSql('UPDATE appointment SET appt_date=?, appt_time=? WHERE appt_id=?', [appt_date, appt_time, req.params.id]);
    saveDb();
    res.json({ message: 'Appointment rescheduled' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/cancel', (req, res) => {
  try {
    const result = transactionCancelAppointment(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/complete', (req, res) => {
  try {
    const { diagnosis } = req.body;
    const result = procedureCompleteAppointment(parseInt(req.params.id), diagnosis);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===================== MEDICINES =====================
app.get('/api/medicines', (req, res) => {
  try {
    const { low_stock } = req.query;
    let medicines;
    if (low_stock === 'true') {
      medicines = queryAll('SELECT * FROM medicine WHERE stock_qty < 50 ORDER BY stock_qty ASC');
    } else {
      medicines = queryAll('SELECT * FROM medicine ORDER BY med_name');
    }
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medicines', (req, res) => {
  try {
    const { med_name, manufacturer, unit_price, stock_qty } = req.body;
    const result = runSql(`
      INSERT INTO medicine (med_name, manufacturer, unit_price, stock_qty) VALUES (?, ?, ?, ?)
    `, [med_name, manufacturer, unit_price, stock_qty || 0]);
    saveDb();
    res.status(201).json({ medicine_id: result.lastInsertRowid, message: 'Medicine added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medicines/:id', (req, res) => {
  try {
    const { med_name, manufacturer, unit_price, stock_qty } = req.body;
    runSql('UPDATE medicine SET med_name=?, manufacturer=?, unit_price=?, stock_qty=? WHERE medicine_id=?',
      [med_name, manufacturer, unit_price, stock_qty, req.params.id]);
    saveDb();
    res.json({ message: 'Medicine updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medicines/:id/restock', (req, res) => {
  try {
    const { add_qty, new_price } = req.body;
    const result = transactionInventoryRestock(parseInt(req.params.id), add_qty, new_price);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===================== PRESCRIPTIONS =====================
app.get('/api/prescriptions/:apptId', (req, res) => {
  try {
    const prescriptions = queryAll(`
      SELECT p.*, m.med_name, m.unit_price, m.manufacturer, (m.unit_price * p.quantity) as line_total
      FROM prescription p
      JOIN medicine m ON p.medicine_id = m.medicine_id
      WHERE p.appt_id = ?
    `, [req.params.apptId]);
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prescriptions', (req, res) => {
  try {
    const { appt_id, items } = req.body;  // items: [{ medicine_id, dosage, duration_days, quantity }]
    if (!Array.isArray(items) || items.length === 0) throw new Error('At least one prescription is required.');
    beginTransaction();
    const results = [];
    for (const item of items) {
      // Trigger 1: Inventory auto-decrement
      const stockResult = triggerInventoryDecrement(item.medicine_id, item.quantity);

      const result = runSql(`
        INSERT INTO prescription (appt_id, medicine_id, dosage, duration_days, quantity)
        VALUES (?, ?, ?, ?, ?)
      `, [appt_id, item.medicine_id, item.dosage, item.duration_days, item.quantity]);

      results.push({
        presc_id: result.lastInsertRowid,
        ...item,
        stock_change: stockResult
      });
    }
    commitTransaction();
    res.status(201).json({ message: 'Prescriptions added', results });
  } catch (err) {
    rollbackTransaction();
    res.status(400).json({ error: err.message });
  }
});

// ===================== BILLING =====================
app.get('/api/bills', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, a.appt_date, a.appt_time, p.patient_name, d.doc_name
      FROM bill b
      JOIN appointment a ON b.appt_id = a.appt_id
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
    `;
    if (status) query += ` WHERE b.payment_status = '${status}'`;
    query += ' ORDER BY b.bill_date DESC';
    res.json(queryAll(query));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bills/:id', (req, res) => {
  try {
    const bill = queryOne(`
      SELECT b.*, a.appt_date, a.appt_time, a.diagnosis,
        p.patient_name, p.phone as patient_phone,
        d.doc_name, d.specialization, dep.dept_name
      FROM bill b
      JOIN appointment a ON b.appt_id = a.appt_id
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN department dep ON d.dept_id = dep.dept_id
      WHERE b.bill_id = ?
    `, [req.params.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const items = queryAll(`
      SELECT p.*, m.med_name, m.unit_price, (m.unit_price * p.quantity) as line_total
      FROM prescription p
      JOIN medicine m ON p.medicine_id = m.medicine_id
      WHERE p.appt_id = ?
    `, [bill.appt_id]);

    res.json({ ...bill, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills/generate/:apptId', (req, res) => {
  try {
    const bill = procedureAutoBill(parseInt(req.params.apptId));
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/bills/:id/pay', (req, res) => {
  try {
    runSql("UPDATE bill SET payment_status = 'Paid' WHERE bill_id = ?", [req.params.id]);
    saveDb();
    res.json({ message: 'Payment recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== TRANSACTIONS  =====================
app.post('/api/transactions/onboarding', (req, res) => {
  try {
    const { patient, appointment } = req.body;
    const result = transactionPatientOnboarding(patient, appointment);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/transactions/consultation', (req, res) => {
  try {
    const { appt_id, diagnosis, prescriptions } = req.body;
    const result = transactionConsultationPrescription(appt_id, diagnosis, prescriptions);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/transactions/billing', (req, res) => {
  try {
    const { appt_id } = req.body;
    const result = transactionBillingPayment(appt_id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/transactions/restock', (req, res) => {
  try {
    const { medicine_id, add_qty, new_price } = req.body;
    const result = transactionInventoryRestock(medicine_id, add_qty, new_price);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/transactions/cancel', (req, res) => {
  try {
    const { appt_id } = req.body;
    const result = transactionCancelAppointment(appt_id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===================== PL/SQL PROCEDURES & FUNCTIONS =====================
app.get('/api/plsql/patient-spend/:id', (req, res) => {
  try {
    const totalSpend = functionGetPatientTotalSpend(parseInt(req.params.id));
    res.json({ patient_id: parseInt(req.params.id), total_spend: totalSpend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plsql/doctor-availability', (req, res) => {
  try {
    const { doctor_id, date, time } = req.query;
    if (!doctor_id || !date || !time) {
      return res.status(400).json({ error: 'doctor_id, date, and time query parameters are required' });
    }
    const isAvailable = functionCheckDoctorAvailability(parseInt(doctor_id), date, time);
    res.json({ doctor_id: parseInt(doctor_id), date, time, available: isAvailable === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plsql/patient-summary/:id', (req, res) => {
  try {
    const summary = cursorPatientVisitSummary(parseInt(req.params.id));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plsql/complete-appointment', (req, res) => {
  try {
    const { appt_id, diagnosis } = req.body;
    const result = procedureCompleteAppointment(parseInt(appt_id), diagnosis);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===================== RAW QUERY ENGINE =====================
app.post('/api/query', (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query text is required.' });
    }
    const cleanSql = sql.replace(/--.*$/gm, '').trim();
    const upper = cleanSql.toUpperCase();
    if (!upper.startsWith('SELECT')) {
      return res.status(400).json({ error: 'Only SELECT queries are allowed in the query runner.' });
    }
    const startTime = Date.now();
    const results = queryAll(cleanSql);
    const elapsed = Date.now() - startTime;
    res.json({ results, rowCount: results.length, executionTime: elapsed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===================== ANALYTICS =====================
app.get('/api/analytics/doctor-appointments', (req, res) => {
  try {
    const data = queryAll(`
      SELECT d.doc_name, d.specialization,
        COUNT(a.appt_id) as total_appointments,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN a.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM doctor d
      LEFT JOIN appointment a ON d.doctor_id = a.doctor_id
      GROUP BY d.doctor_id, d.doc_name
      ORDER BY total_appointments DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/department-revenue', (req, res) => {
  try {
    const data = queryAll(`
      SELECT dep.dept_name,
        COUNT(DISTINCT d.doctor_id) as doctors,
        COUNT(a.appt_id) as appointments,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN b.payment_status = 'Paid' THEN b.total_amount ELSE 0 END), 0) as collected,
        COALESCE(SUM(CASE WHEN b.payment_status = 'Pending' THEN b.total_amount ELSE 0 END), 0) as pending
      FROM department dep
      LEFT JOIN doctor d ON dep.dept_id = d.dept_id
      LEFT JOIN appointment a ON d.doctor_id = a.doctor_id
      LEFT JOIN bill b ON a.appt_id = b.appt_id
      GROUP BY dep.dept_id, dep.dept_name
      ORDER BY total_revenue DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/pending-bills', (req, res) => {
  try {
    const data = queryAll(`
      SELECT b.*, p.patient_name, d.doc_name, a.appt_date
      FROM bill b
      JOIN appointment a ON b.appt_id = a.appt_id
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE b.payment_status = 'Pending'
      ORDER BY b.bill_date ASC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/top-medicines', (req, res) => {
  try {
    const data = queryAll(`
      SELECT m.med_name, m.manufacturer, m.unit_price, m.stock_qty,
        COUNT(p.presc_id) as times_prescribed,
        SUM(p.quantity) as total_qty_prescribed,
        SUM(m.unit_price * p.quantity) as total_revenue
      FROM medicine m
      LEFT JOIN prescription p ON m.medicine_id = p.medicine_id
      GROUP BY m.medicine_id, m.med_name, m.manufacturer, m.unit_price, m.stock_qty
      HAVING COUNT(p.presc_id) > 0
      ORDER BY total_qty_prescribed DESC
      LIMIT 10
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== PREDEFINED QUERIES =====================
app.get('/api/queries/predefined', (req, res) => {
  const queries = [
    {
      id: 1,
      name: 'Inner Join: Appointments with Patient & Doctor Details',
      category: 'JOIN',
      sql: `SELECT a.appt_id, p.patient_name, d.doc_name, d.specialization, a.appt_date, a.appt_time, a.status\nFROM appointment a\nINNER JOIN patient p ON a.patient_id = p.patient_id\nINNER JOIN doctor d ON a.doctor_id = d.doctor_id\nORDER BY a.appt_date DESC;`
    },
    {
      id: 2,
      name: 'Left Join: All Doctors with Appointment Count',
      category: 'JOIN',
      sql: `SELECT d.doc_name, d.specialization, dep.dept_name, COUNT(a.appt_id) as appointment_count\nFROM doctor d\nLEFT JOIN appointment a ON d.doctor_id = a.doctor_id\nJOIN department dep ON d.dept_id = dep.dept_id\nGROUP BY d.doctor_id, d.doc_name, d.specialization, dep.dept_name\nORDER BY appointment_count DESC;`
    },
    {
      id: 3,
      name: 'Aggregate: Total Revenue per Doctor',
      category: 'AGGREGATE',
      sql: `SELECT d.doc_name, COUNT(b.bill_id) as bills, SUM(b.total_amount) as total_revenue, AVG(b.total_amount) as avg_bill\nFROM doctor d\nJOIN appointment a ON d.doctor_id = a.doctor_id\nJOIN bill b ON a.appt_id = b.appt_id\nGROUP BY d.doctor_id, d.doc_name\nHAVING SUM(b.total_amount) > 0\nORDER BY total_revenue DESC;`
    },
    {
      id: 4,
      name: 'GROUP BY/HAVING: Departments with Revenue > 1000',
      category: 'GROUP BY',
      sql: `SELECT dep.dept_name, SUM(b.total_amount) as dept_revenue, COUNT(DISTINCT a.appt_id) as total_appts\nFROM department dep\nJOIN doctor d ON dep.dept_id = d.dept_id\nJOIN appointment a ON d.doctor_id = a.doctor_id\nJOIN bill b ON a.appt_id = b.appt_id\nGROUP BY dep.dept_id, dep.dept_name\nHAVING SUM(b.total_amount) > 1000\nORDER BY dept_revenue DESC;`
    },
    {
      id: 5,
      name: 'Subquery: Patients with Multiple Appointments',
      category: 'SUBQUERY',
      sql: `SELECT p.patient_id, p.patient_name, p.phone, (SELECT COUNT(*) FROM appointment a WHERE a.patient_id = p.patient_id) as visit_count\nFROM patient p\nWHERE (SELECT COUNT(*) FROM appointment a WHERE a.patient_id = p.patient_id) > 1\nORDER BY visit_count DESC;`
    },
    {
      id: 6,
      name: 'CASE: Appointment Status Summary',
      category: 'CASE',
      sql: `SELECT p.patient_name, a.appt_date, CASE a.status WHEN 'Scheduled' THEN '📅 Upcoming' WHEN 'Completed' THEN '✅ Done' WHEN 'Cancelled' THEN '❌ Cancelled' END as status_label, CASE WHEN b.payment_status = 'Paid' THEN '💰 Paid' WHEN b.payment_status = 'Pending' THEN '⏳ Pending' ELSE '—' END as payment_label\nFROM appointment a\nJOIN patient p ON a.patient_id = p.patient_id\nLEFT JOIN bill b ON a.appt_id = b.appt_id\nORDER BY a.appt_date DESC;`
    },
    {
      id: 7,
      name: 'Aggregate: Medicine Inventory Status',
      category: 'AGGREGATE',
      sql: `SELECT med_name, manufacturer, stock_qty, unit_price, CASE WHEN stock_qty < 50 THEN 'CRITICAL' WHEN stock_qty < 200 THEN 'LOW' ELSE 'OK' END as stock_status\nFROM medicine\nORDER BY stock_qty ASC;`
    },
    {
      id: 8,
      name: 'Join: Full Prescription Details with Cost',
      category: 'JOIN',
      sql: `SELECT p.patient_name, d.doc_name, a.appt_date, m.med_name, pr.dosage, pr.quantity, m.unit_price, (m.unit_price * pr.quantity) as line_total\nFROM prescription pr\nJOIN appointment a ON pr.appt_id = a.appt_id\nJOIN patient p ON a.patient_id = p.patient_id\nJOIN doctor d ON a.doctor_id = d.doctor_id\nJOIN medicine m ON pr.medicine_id = m.medicine_id\nORDER BY a.appt_date DESC;`
    },
    {
      id: 9,
      name: 'GROUP BY: Monthly Revenue Trend',
      category: 'GROUP BY',
      sql: `SELECT substr(b.bill_date, 1, 7) as month, COUNT(*) as bills_generated, SUM(b.total_amount) as total_revenue, SUM(CASE WHEN b.payment_status = 'Paid' THEN b.total_amount ELSE 0 END) as collected\nFROM bill b\nGROUP BY substr(b.bill_date, 1, 7)\nORDER BY month;`
    },
    {
      id: 10,
      name: 'Subquery: Doctors with Above-Average Fees',
      category: 'SUBQUERY',
      sql: `SELECT doc_name, specialization, consultation_fee\nFROM doctor\nWHERE consultation_fee > (SELECT AVG(consultation_fee) FROM doctor)\nORDER BY consultation_fee DESC;`
    },
    {
      id: 11,
      name: 'CASE: Patient Age Classification',
      category: 'CASE',
      sql: `SELECT patient_name, dob, CASE WHEN (julianday('now') - julianday(dob))/365.25 < 18 THEN 'Pediatric' WHEN (julianday('now') - julianday(dob))/365.25 < 40 THEN 'Young Adult' WHEN (julianday('now') - julianday(dob))/365.25 < 60 THEN 'Middle Age' ELSE 'Senior' END as age_group, blood_group\nFROM patient\nORDER BY dob;`
    },
    {
      id: 12,
      name: 'Aggregate: Doctor Workload Analysis',
      category: 'AGGREGATE',
      sql: `SELECT d.doc_name, d.specialization, COUNT(a.appt_id) as total, SUM(CASE WHEN a.status='Completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN a.status='Scheduled' THEN 1 ELSE 0 END) as upcoming, ROUND(100.0 * SUM(CASE WHEN a.status='Completed' THEN 1 ELSE 0 END) / COUNT(a.appt_id), 1) as completion_rate\nFROM doctor d\nJOIN appointment a ON d.doctor_id = a.doctor_id\nGROUP BY d.doctor_id\nORDER BY total DESC;`
    },
    {
      id: 13,
      name: 'Join: Unpaid Bills with Patient Contact',
      category: 'JOIN',
      sql: `SELECT b.bill_id, p.patient_name, p.phone, b.total_amount, b.bill_date, d.doc_name\nFROM bill b\nJOIN appointment a ON b.appt_id = a.appt_id\nJOIN patient p ON a.patient_id = p.patient_id\nJOIN doctor d ON a.doctor_id = d.doctor_id\nWHERE b.payment_status = 'Pending'\nORDER BY b.total_amount DESC;`
    },
    {
      id: 14,
      name: 'GROUP BY: Blood Group Distribution',
      category: 'GROUP BY',
      sql: `SELECT blood_group, COUNT(*) as patient_count, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patient), 1) as percentage\nFROM patient\nGROUP BY blood_group\nORDER BY patient_count DESC;`
    },
    {
      id: 15,
      name: 'Subquery: Most Expensive Appointments',
      category: 'SUBQUERY',
      sql: `SELECT p.patient_name, d.doc_name, a.appt_date, b.total_amount\nFROM bill b\nJOIN appointment a ON b.appt_id = a.appt_id\nJOIN patient p ON a.patient_id = p.patient_id\nJOIN doctor d ON a.doctor_id = d.doctor_id\nWHERE b.total_amount > (SELECT AVG(total_amount) FROM bill)\nORDER BY b.total_amount DESC;`
    },
    {
      id: 16,
      name: 'CASE: Revenue Tier Classification',
      category: 'CASE',
      sql: `SELECT dep.dept_name, SUM(b.total_amount) as revenue, CASE WHEN SUM(b.total_amount) > 5000 THEN '🟢 High Performer' WHEN SUM(b.total_amount) > 2000 THEN '🟡 Moderate' ELSE '🔴 Low' END as tier\nFROM department dep\nJOIN doctor d ON dep.dept_id = d.dept_id\nJOIN appointment a ON d.doctor_id = a.doctor_id\nJOIN bill b ON a.appt_id = b.appt_id\nGROUP BY dep.dept_id, dep.dept_name\nORDER BY revenue DESC;`
    },
    {
      id: 17,
      name: 'Complex Join: Complete Patient Visit Timeline',
      category: 'JOIN',
      sql: `SELECT p.patient_name, a.appt_date, a.appt_time, d.doc_name, dep.dept_name, a.status, a.diagnosis, COALESCE(b.total_amount, 0) as billed, COALESCE(b.payment_status, 'N/A') as paid\nFROM patient p\nJOIN appointment a ON p.patient_id = a.patient_id\nJOIN doctor d ON a.doctor_id = d.doctor_id\nJOIN department dep ON d.dept_id = dep.dept_id\nLEFT JOIN bill b ON a.appt_id = b.appt_id\nORDER BY p.patient_name, a.appt_date DESC;`
    },
  ];
  res.json(queries);
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`\n🏥 HMS Backend running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
