import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  AlertCircle
} from 'lucide-react';

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getCurrentTimeStr = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const getInitialBookingState = () => {
  const now = new Date();
  const todayStr = getTodayStr();
  const currentTime = getCurrentTimeStr();

  const availableToday = TIME_SLOTS.filter((t) => t > currentTime);
  if (availableToday.length > 0) {
    return { appt_date: todayStr, appt_time: availableToday[0] };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return { appt_date: `${y}-${m}-${d}`, appt_time: '09:00' };
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [activeAppt, setActiveAppt] = useState(null);

  // Forms
  const [bookForm, setBookForm] = useState(() => {
    const init = getInitialBookingState();
    return {
      patient_id: '',
      doctor_id: '',
      appt_date: init.appt_date,
      appt_time: init.appt_time,
    };
  });

  const [reschedForm, setReschedForm] = useState({
    appt_date: '',
    appt_time: '',
  });

  const [diagnosisText, setDiagnosisText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptRes, patRes, docRes] = await Promise.all([
        api.get(`/appointments${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get('/patients'),
        api.get('/doctors'),
      ]);
      setAppointments(apptRes.data);
      setPatients(patRes.data);
      setDoctors(docRes.data);

      if (patRes.data.length > 0 && !bookForm.patient_id) {
        setBookForm((prev) => ({ ...prev, patient_id: patRes.data[0].patient_id }));
      }
      if (docRes.data.length > 0 && !bookForm.doctor_id) {
        setBookForm((prev) => ({ ...prev, doctor_id: docRes.data[0].doctor_id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const todayStr = getTodayStr();
    const currentTimeStr = getCurrentTimeStr();

    if (bookForm.appt_date < todayStr) {
      setErrorMsg(`Cannot book an appointment for a previous date (${bookForm.appt_date}). Please select today or an upcoming date.`);
      return;
    }
    if (bookForm.appt_date === todayStr && bookForm.appt_time <= currentTimeStr) {
      setErrorMsg(`Cannot book an appointment for a time in the past (${bookForm.appt_time}). Current time is ${currentTimeStr}. Please select an upcoming slot.`);
      return;
    }

    try {
      await api.post('/appointments', bookForm);
      setShowBookModal(false);
      setSuccessMsg('Appointment booked successfully!');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to book appointment');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const todayStr = getTodayStr();
    const currentTimeStr = getCurrentTimeStr();

    if (reschedForm.appt_date < todayStr) {
      setErrorMsg(`Cannot reschedule to a previous date (${reschedForm.appt_date}). Please select today or an upcoming date.`);
      return;
    }
    if (reschedForm.appt_date === todayStr && reschedForm.appt_time <= currentTimeStr) {
      setErrorMsg(`Cannot reschedule to a time in the past (${reschedForm.appt_time}). Current time is ${currentTimeStr}. Please select an upcoming slot.`);
      return;
    }

    try {
      await api.put(`/appointments/${activeAppt.appt_id}/reschedule`, reschedForm);
      setShowRescheduleModal(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reschedule appointment');
    }
  };

  const handleCancel = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This will release the doctor slot.')) return;
    try {
      await api.put(`/appointments/${apptId}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Cancellation failed');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.put(`/appointments/${activeAppt.appt_id}/complete`, { diagnosis: diagnosisText });
      setShowCompleteModal(false);
      setActiveAppt(null);
      setDiagnosisText('');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Could not complete appointment. (Trigger 2: Prescriptions required)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 shadow-xs"
          >
            <option value="">All Statuses (Scheduled, Completed, Cancelled)</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setShowBookModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment (FR3)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Appointment Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Appt ID</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Doctor & Dept</th>
                <th className="px-5 py-3.5">Scheduled Slot</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Diagnosis</th>
                <th className="px-5 py-3.5 text-right">Lifecycle Actions (FR4)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">No appointments found.</td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appt_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-teal-700 font-bold">#{a.appt_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{a.patient_name}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{a.doc_name}</div>
                      <div className="text-[11px] text-slate-500">{a.specialization} ({a.dept_name})</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">
                      <div>{a.appt_date}</div>
                      <div className="text-teal-700 font-bold">{a.appt_time}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        a.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : a.status === 'Scheduled'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {a.status === 'Completed' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {a.status === 'Scheduled' && <Clock className="w-3 h-3 text-blue-600" />}
                        {a.status === 'Cancelled' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs italic truncate">
                      {a.diagnosis || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {a.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveAppt(a);
                              setReschedForm({ appt_date: a.appt_date, appt_time: a.appt_time });
                              setErrorMsg('');
                              setShowRescheduleModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => {
                              setActiveAppt(a);
                              setDiagnosisText('');
                              setErrorMsg('');
                              setShowCompleteModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer"
                            title="Complete Consultation (Trigger 2 Enforced)"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(a.appt_id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {a.status !== 'Scheduled' && (
                        <span className="text-xs text-slate-400 italic">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Book Appointment (FR3)</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={bookForm.patient_id}
                  onChange={(e) => setBookForm({ ...bookForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-600"
                >
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      #{p.patient_id} - {p.patient_name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor *</label>
                <select
                  required
                  value={bookForm.doctor_id}
                  onChange={(e) => setBookForm({ ...bookForm, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-600"
                >
                  {doctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.doc_name} — {d.specialization} (₹{d.consultation_fee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date * (Upcoming)</label>
                  <input
                    type="date"
                    required
                    min={getTodayStr()}
                    value={bookForm.appt_date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const todayStr = getTodayStr();
                      const currentTime = getCurrentTimeStr();
                      let newTime = bookForm.appt_time;
                      if (newDate === todayStr && newTime <= currentTime) {
                        const nextSlot = TIME_SLOTS.find((t) => t > currentTime);
                        if (nextSlot) newTime = nextSlot;
                      }
                      setBookForm({ ...bookForm, appt_date: newDate, appt_time: newTime });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={bookForm.appt_time}
                    onChange={(e) => setBookForm({ ...bookForm, appt_time: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-teal-600"
                  >
                    {TIME_SLOTS.map((t) => {
                      const isPast = bookForm.appt_date === getTodayStr() && t <= getCurrentTimeStr();
                      return (
                        <option key={t} value={t} disabled={isPast}>
                          {t} {isPast ? '(Past)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                Composite Constraint: UNIQUE (doctor_id, appt_date, appt_time) strictly rejects collisions.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs"
                >
                  Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Reschedule #{activeAppt?.appt_id}</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReschedule} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date * (Upcoming)</label>
                <input
                  type="date"
                  required
                  min={getTodayStr()}
                  value={reschedForm.appt_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const todayStr = getTodayStr();
                    const currentTime = getCurrentTimeStr();
                    let newTime = reschedForm.appt_time;
                    if (newDate === todayStr && newTime <= currentTime) {
                      const nextSlot = TIME_SLOTS.find((t) => t > currentTime);
                      if (nextSlot) newTime = nextSlot;
                    }
                    setReschedForm({ ...reschedForm, appt_date: newDate, appt_time: newTime });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Time Slot *</label>
                <select
                  value={reschedForm.appt_time}
                  onChange={(e) => setReschedForm({ ...reschedForm, appt_time: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600"
                >
                  {TIME_SLOTS.map((t) => {
                    const isPast = reschedForm.appt_date === getTodayStr() && t <= getCurrentTimeStr();
                    return (
                      <option key={t} value={t} disabled={isPast}>
                        {t} {isPast ? '(Past)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs">Confirm Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Appointment Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  Procedure 2 & Trigger 2 Guard
                </div>
                <h3 className="text-lg font-bold text-slate-900">Complete Consultation #{activeAppt?.appt_id}</h3>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Trigger 2: Appointment Completion Guard Enforced</span>
                </div>
                <p>{errorMsg}</p>
                <p className="text-[11px] text-slate-600">
                  Tip: Visit the <strong>Pharmacy & Prescriptions</strong> tab to prescribe medicine for this appointment before discharging.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs">
                ℹ Marking completed will execute Procedure 2 (atomically generating the final invoice and locking status).
              </div>
            )}

            <form onSubmit={handleComplete} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis & Notes *</label>
                <textarea
                  rows="3"
                  required
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  placeholder="Record patient symptoms, findings, and diagnostic impressions..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCompleteModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs">
                  Complete & Discharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
