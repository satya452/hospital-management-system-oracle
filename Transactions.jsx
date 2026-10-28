import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Layers,
  Play,
  CheckCircle2,
  Terminal,
  Database,
  ShieldAlert,
  Pill,
  UserPlus,
  RefreshCw,
  XCircle,
  Receipt
} from 'lucide-react';

export default function Transactions() {
  const [selectedTxn, setSelectedTxn] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [scheduledAppts, setScheduledAppts] = useState([]);
  const [completedAppts, setCompletedAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Live Execution Drawer State
  const [executionLog, setExecutionLog] = useState(null);
  const [errorLog, setErrorLog] = useState(null);

  // Form states for each transaction
  // Txn 1: Onboarding
  const [t1Patient, setT1Patient] = useState({
    patient_name: 'Vikram Seth',
    dob: '1992-06-15',
    gender: 'M',
    blood_group: 'B+',
    phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
    address: '42 Lotus Boulevard, Bangalore',
  });
  const [t1Appt, setT1Appt] = useState({
    doctor_id: '',
    appt_date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    appt_time: '11:00',
  });

  // Txn 2: Consultation & Prescription
  const [t2ApptId, setT2ApptId] = useState('');
  const [t2Diagnosis, setT2Diagnosis] = useState('Acute bacterial tonsillitis with fever');
  const [t2MedId, setT2MedId] = useState('');
  const [t2Qty, setT2Qty] = useState(14);

  // Txn 3: Automated Billing & Payment
  const [t3ApptId, setT3ApptId] = useState('');

  // Txn 4: Restock
  const [t4MedId, setT4MedId] = useState('');
  const [t4AddQty, setT4AddQty] = useState(100);
  const [t4NewPrice, setT4NewPrice] = useState(15.50);

  // Txn 5: Cancel
  const [t5ApptId, setT5ApptId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [docRes, medRes, apptRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/medicines'),
        api.get('/appointments')
      ]);
      setDoctors(docRes.data);
      setMedicines(medRes.data);

      const scheduled = apptRes.data.filter((a) => a.status === 'Scheduled');
      const completed = apptRes.data.filter((a) => a.status === 'Completed');
      setScheduledAppts(scheduled);
      setCompletedAppts(completed);

      if (docRes.data.length > 0) setT1Appt((p) => ({ ...p, doctor_id: docRes.data[0].doctor_id }));
      if (scheduled.length > 0) {
        setT2ApptId(scheduled[0].appt_id);
        setT5ApptId(scheduled[0].appt_id);
      }
      if (medRes.data.length > 0) {
        setT2MedId(medRes.data[0].medicine_id);
        setT4MedId(medRes.data[0].medicine_id);
      }
      if (completed.length > 0) setT3ApptId(completed[0].appt_id);
    } catch (err) {
      console.error(err);
    }
  };

  const executeTransaction = async () => {
    setLoading(true);
    setExecutionLog(null);
    setErrorLog(null);

    try {
      let res;
      let meta = {};

      if (selectedTxn === 1) {
        const cleanPhone = String(t1Patient.phone || '').trim();
        if (!/^\d{10}$/.test(cleanPhone)) {
          setErrorLog('Mobile number must be exactly 10 digits (numbers only).');
          setLoading(false);
          return;
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (t1Appt.appt_date < todayStr || (t1Appt.appt_date === todayStr && t1Appt.appt_time <= currentTimeStr)) {
          setErrorLog('Cannot book appointment for a past date or time. Please select an upcoming date and time slot.');
          setLoading(false);
          return;
        }

        if (!t1Appt.doctor_id) {
          setErrorLog('Please select a doctor before booking an appointment.');
          return;
        }

        meta = {
          name: 'Transaction 1: Patient Onboarding & Initial Booking',
          operation: 'Atomic registration of new patient profile + initial appointment scheduling',
          tables: ['PATIENT', 'APPOINTMENT'],
          plsql: ['Function 2 (Doctor Availability Checker)', 'Atomic multi-table INSERT'],
          effect: 'Creates row in PATIENT, locks doctor date/time slot in APPOINTMENT',
        };
        res = await api.post('/transactions/onboarding', {
          patient: { ...t1Patient, phone: cleanPhone },
          appointment: { ...t1Appt, doctor_id: parseInt(t1Appt.doctor_id) },
        });
      } else if (selectedTxn === 2) {
        meta = {
          name: 'Transaction 2: Doctor Consultation & Prescription Processing',
          operation: 'Clinical diagnosis recording + multi-item prescription issuance + real-time stock reduction',
          tables: ['PRESCRIPTION', 'MEDICINE', 'APPOINTMENT'],
          plsql: [
            'Trigger 1 (Inventory Auto-Decrement)',
            'Trigger 2 (Appointment Completion Guard)',
            'Atomic status transition'
          ],
          effect: 'Inserts into PRESCRIPTION, decrements MEDICINE.stock_qty, updates APPOINTMENT status to Completed',
        };
        res = await api.post('/transactions/consultation', {
          appt_id: parseInt(t2ApptId),
          diagnosis: t2Diagnosis,
          prescriptions: [
            {
              medicine_id: parseInt(t2MedId),
              dosage: '1 tablet twice daily after food',
              duration_days: 7,
              quantity: parseInt(t2Qty),
            },
          ],
        });
      } else if (selectedTxn === 3) {
        meta = {
          name: 'Transaction 3: Automated Billing & Payment Processing',
          operation: 'Executing auto-bill calculation, invoice creation, and immediate payment reconciliation',
          tables: ['BILL', 'APPOINTMENT', 'DOCTOR', 'PRESCRIPTION', 'MEDICINE'],
          plsql: ['Procedure 1 (Auto-Bill Generator)', 'Atomic Snapshot Payment UPDATE'],
          effect: 'Computes consultation_fee + SUM(med_price * qty), inserts BILL, sets payment_status = Paid',
        };
        res = await api.post('/transactions/billing', {
          appt_id: parseInt(t3ApptId),
        });
      } else if (selectedTxn === 4) {
        meta = {
          name: 'Transaction 4: Inventory Restock & Price Adjustment',
          operation: 'Pharmacy replenishment + unit price revision + low stock condition monitoring',
          tables: ['MEDICINE'],
          plsql: ['Transactional UPDATE with Stock Quantity Check', 'Low-stock threshold check (< 50)'],
          effect: 'Updates stock_qty and unit_price in MEDICINE, evaluates threshold alerts',
        };
        res = await api.post('/transactions/restock', {
          medicine_id: parseInt(t4MedId),
          add_qty: parseInt(t4AddQty),
          new_price: parseFloat(t4NewPrice),
        });
      } else if (selectedTxn === 5) {
        meta = {
          name: 'Transaction 5: Appointment Cancellation & Slot Cleanup',
          operation: 'Appointment revocation and doctor schedule release',
          tables: ['APPOINTMENT'],
          plsql: ['State verification check', 'Atomic schedule slot release UPDATE'],
          effect: 'Marks status as Cancelled, releases UNIQUE (doctor_id, appt_date, appt_time) constraint slot',
        };
        res = await api.post('/transactions/cancel', {
          appt_id: parseInt(t5ApptId),
        });
      }

      setExecutionLog({
        meta,
        result: res.data,
        timestamp: new Date().toISOString(),
      });
      fetchInitialData();
    } catch (err) {
      setErrorLog(err.response?.data?.error || err.message || 'Transaction execution failed');
    } finally {
      setLoading(false);
    }
  };

  const txnDescriptions = [
    {
      id: 1,
      title: 'Txn 1: Patient Onboarding & Booking',
      desc: 'Inserts into PATIENT and APPOINTMENT atomically, ensuring slot availability.',
      icon: UserPlus,
    },
    {
      id: 2,
      title: 'Txn 2: Consultation & E-Prescription',
      desc: 'Records diagnosis, adds prescription, auto-decrements medicine stock via Trigger 1.',
      icon: Pill,
    },
    {
      id: 3,
      title: 'Txn 3: Auto-Billing & Payment',
      desc: 'Invokes Procedure 1 to compute invoice snapshot and records payment in one transaction.',
      icon: Receipt,
    },
    {
      id: 4,
      title: 'Txn 4: Inventory Restock & Pricing',
      desc: 'Replenishes pharmaceutical inventory and updates pricing with live threshold check.',
      icon: RefreshCw,
    },
    {
      id: 5,
      title: 'Txn 5: Cancellation & Slot Cleanup',
      desc: 'Cancels scheduled appointment and safely releases doctor slot for rebooking.',
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Demonstration of 5 Integrated Real-World Transactions
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Each workflow executes atomic multi-table operations strictly preserving ACID properties, foreign key integrity, and trigger guards.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span>Transaction Mode: </span>
            <span className="text-emerald-700 font-bold">IMMEDIATE / ATOMIC</span>
          </div>
        </div>
      </div>

      {/* Transaction Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {txnDescriptions.map((t) => {
          const Icon = t.icon;
          const isActive = selectedTxn === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTxn(t.id);
                setExecutionLog(null);
                setErrorLog(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-teal-50/90 border-teal-300 text-teal-900 shadow-xs ring-1 ring-teal-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl ${isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-teal-800' : 'text-slate-400'}`}>
                  #0{t.id}
                </span>
              </div>
              <div>
                <h4 className={`text-xs font-bold leading-snug ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                  {t.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {t.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Execution Workspace: Form on Left, Live Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transaction Parameters Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider font-mono">
              Configurable Parameters
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {txnDescriptions[selectedTxn - 1].title}
            </h3>
          </div>

          {/* Form 1: Patient Onboarding */}
          {selectedTxn === 1 && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Patient Name</label>
                <input
                  type="text"
                  value={t1Patient.patient_name}
                  onChange={(e) => setT1Patient({ ...t1Patient, patient_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">DOB</label>
                  <input
                    type="date"
                    value={t1Patient.dob}
                    onChange={(e) => setT1Patient({ ...t1Patient, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Blood Group</label>
                  <select
                    value={t1Patient.blood_group}
                    onChange={(e) => setT1Patient({ ...t1Patient, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Mobile Number * (10 Digits, Unique)</label>
                  <span className="text-[10px] text-slate-400 font-mono">{t1Patient.phone?.length || 0}/10</span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={t1Patient.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setT1Patient({ ...t1Patient, phone: val });
                  }}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-semibold mb-1">Initial Consultation Doctor</label>
                <select
                  value={t1Appt.doctor_id}
                  onChange={(e) => setT1Appt({ ...t1Appt, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {doctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.doc_name} — {d.specialization} (₹{d.consultation_fee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date (Upcoming)</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={t1Appt.appt_date}
                    onChange={(e) => setT1Appt({ ...t1Appt, appt_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Time</label>
                  <select
                    value={t1Appt.appt_time}
                    onChange={(e) => setT1Appt({ ...t1Appt, appt_time: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  >
                    {['09:00', '10:00', '11:00', '14:00', '15:00'].map((t) => {
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                      const isPast = t1Appt.appt_date === todayStr && t <= currentTimeStr;
                      return (
                        <option key={t} value={t} disabled={isPast}>
                          {t} {isPast ? '(Past)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form 2: Consultation & Prescription */}
          {selectedTxn === 2 && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Scheduled Appointment</label>
                <select
                  value={t2ApptId}
                  onChange={(e) => setT2ApptId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {scheduledAppts.length === 0 ? (
                    <option value="">No scheduled appointments available</option>
                  ) : (
                    scheduledAppts.map((a) => (
                      <option key={a.appt_id} value={a.appt_id}>
                        Appt #{a.appt_id}: {a.patient_name} with {a.doc_name} ({a.appt_date})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Diagnosis Notes</label>
                <textarea
                  rows="2"
                  value={t2Diagnosis}
                  onChange={(e) => setT2Diagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Prescribed Medicine</label>
                  <select
                    value={t2MedId}
                    onChange={(e) => setT2MedId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                  >
                    {medicines.map((m) => (
                      <option key={m.medicine_id} value={m.medicine_id}>
                        {m.med_name} (Stock: {m.stock_qty})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Qty to Deduct</label>
                  <input
                    type="number"
                    min="1"
                    value={t2Qty}
                    onChange={(e) => setT2Qty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                Trigger 1 will execute during this transaction, atomically reducing stock and raising an exception if stock is inadequate.
              </div>
            </div>
          )}

          {/* Form 3: Auto-Billing & Payment */}
          {selectedTxn === 3 && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Completed Consultation</label>
                <select
                  value={t3ApptId}
                  onChange={(e) => setT3ApptId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {completedAppts.length === 0 ? (
                    <option value="">No completed appointments</option>
                  ) : (
                    completedAppts.map((a) => (
                      <option key={a.appt_id} value={a.appt_id}>
                        Appt #{a.appt_id} — {a.patient_name} with {a.doc_name} ({a.appt_date})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                ℹ Procedure 1 calculates <code>consultation_charge + SUM(medicine unit_price * quantity)</code> and creates a snapshot row in the <code>BILL</code> table, then immediately sets <code>payment_status = 'Paid'</code> in the same transaction block.
              </div>
            </div>
          )}

          {/* Form 4: Inventory Restock */}
          {selectedTxn === 4 && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Medicine to Restock</label>
                <select
                  value={t4MedId}
                  onChange={(e) => setT4MedId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {medicines.map((m) => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      #{m.medicine_id}: {m.med_name} (Current Stock: {m.stock_qty}, ₹{m.unit_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Add Stock (+ units)</label>
                  <input
                    type="number"
                    min="1"
                    value={t4AddQty}
                    onChange={(e) => setT4AddQty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.5"
                    value={t4NewPrice}
                    onChange={(e) => setT4NewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form 5: Appointment Cancellation */}
          {selectedTxn === 5 && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Scheduled Appointment to Cancel</label>
                <select
                  value={t5ApptId}
                  onChange={(e) => setT5ApptId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {scheduledAppts.length === 0 ? (
                    <option value="">No scheduled appointments available</option>
                  ) : (
                    scheduledAppts.map((a) => (
                      <option key={a.appt_id} value={a.appt_id}>
                        Appt #{a.appt_id}: {a.patient_name} with {a.doc_name} ({a.appt_date} at {a.appt_time})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
                Cancelling updates the status to 'Cancelled' and releases the doctor's date/time slot so other patients can rebook it.
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={executeTransaction}
            disabled={loading}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>Execute Atomic Transaction</span>
          </button>
        </div>

        {/* Right: Live Execution Drawer (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4 font-mono text-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-200">Live Transaction Execution Drawer</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Telemetry Pipeline</span>
            </div>

            {errorLog && (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>TRANSACTION ROLLBACK / CONSTRAINT VIOLATION</span>
                </div>
                <p className="font-mono text-xs">{errorLog}</p>
              </div>
            )}

            {!executionLog && !errorLog && (
              <div className="py-20 text-center text-slate-500 text-xs space-y-2 font-sans">
                <Database className="w-10 h-10 mx-auto text-slate-700" />
                <p>Select a transaction on the left and click "Execute Atomic Transaction".</p>
                <p className="text-[11px] text-slate-600">Live execution drawer logs tables involved, triggers executed, and database effects.</p>
              </div>
            )}

            {executionLog && (
              <div className="mt-4 space-y-4 text-xs">
                {/* Header Meta */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans">Operation:</span>
                    <span className="text-teal-400 font-semibold">{executionLog.meta.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Tables Involved:</span>
                    <div className="flex gap-1 mt-0.5">
                      {executionLog.meta.tables.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-bold text-[10px] border border-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PL/SQL Triggered */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] space-y-1">
                  <span className="text-slate-400 block font-sans">SQL/PL-SQL Component Triggered:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {executionLog.meta.plsql.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-semibold">
                        ⚡ {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step Logs */}
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block font-sans">
                    Atomic Execution Trace
                  </span>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    {executionLog.result.logs?.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-slate-200 font-bold">{log.step}: </span>
                          <span className="text-slate-300">{log.detail}</span>
                          {log.trigger && (
                            <span className="ml-2 px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] border border-purple-800">
                              [{log.trigger}]
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated JSON Output */}
                <div>
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block mb-1 font-sans">
                    Generated Result (JSON Response)
                  </span>
                  <pre className="p-3 rounded-xl bg-black/40 border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto max-h-40">
                    {JSON.stringify(executionLog.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center font-sans">
            <span>Status: {loading ? 'Processing' : errorLog ? 'Failed' : executionLog ? 'Completed' : 'Ready'}</span>
            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
