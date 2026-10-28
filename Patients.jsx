import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  UserPlus,
  Search,
  FileText,
  Edit2,
  Droplet,
  X,
  CreditCard,
  Pill,
  AlertCircle,
  Trash2
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

  const [formData, setFormData] = useState({
    patient_name: '',
    dob: '',
    gender: 'M',
    blood_group: 'O+',
    phone: '',
    address: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = formData.phone ? formData.phone.trim() : '';
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMsg('Mobile number must be exactly 10 digits (numbers only).');
      return;
    }

    try {
      if (editPatient) {
        await api.put(`/patients/${editPatient.patient_id}`, { ...formData, phone: cleanPhone });
      } else {
        await api.post('/patients', { ...formData, phone: cleanPhone });
      }
      setShowRegisterModal(false);
      setEditPatient(null);
      setFormData({
        patient_name: '',
        dob: '',
        gender: 'M',
        blood_group: 'O+',
        phone: '',
        address: '',
      });
      fetchPatients();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save patient record');
    }
  };

  const viewHistory = async (patientId) => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/patients/${patientId}/history`);
      setSelectedHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEditModal = (patient) => {
    setEditPatient(patient);
    setFormData({
      patient_name: patient.patient_name,
      dob: patient.dob,
      gender: patient.gender,
      blood_group: patient.blood_group,
      phone: patient.phone,
      address: patient.address || '',
    });
    setErrorMsg('');
    setShowRegisterModal(true);
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to delete Patient #${patientId} (${patientName})?`)) {
      return;
    }
    try {
      await api.delete(`/patients/${patientId}`);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete patient');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, Phone or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-xs transition-colors"
          />
        </div>

        <button
          onClick={() => {
            setEditPatient(null);
            setFormData({ patient_name: '', dob: '', gender: 'M', blood_group: 'O+', phone: '', address: '' });
            setErrorMsg('');
            setShowRegisterModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Patient Name</th>
                <th className="px-5 py-3.5">DOB / Gender</th>
                <th className="px-5 py-3.5">Blood Group</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Address</th>
                <th className="px-5 py-3.5">Reg. Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-500">No patients found.</td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-teal-700 font-semibold">#{p.patient_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{p.patient_name}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {p.dob} <span className="text-slate-400">({p.gender})</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <Droplet className="w-3 h-3" /> {p.blood_group}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{p.phone}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">{p.address || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{p.registered_date}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => viewHistory(p.patient_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors cursor-pointer"
                        title="View Clinical Summary Report"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" /> History
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                        title="Edit Info"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(p.patient_id, p.patient_name)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 transition-colors cursor-pointer"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editPatient ? `Edit Patient #${editPatient.patient_id}` : 'Register New Patient (FR1)'}
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="O">Other (O)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mobile Number * (Unique)</label>
                    <span className="text-[10px] text-slate-400 font-mono">{formData.phone.length}/10</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: val });
                    }}
                    placeholder="e.g. 9876543210 (10 digits)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Postal Code"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {editPatient ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Summary Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-teal-700">
                  Cursor 1 Report & Function 1 (Total Spend)
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Visit History: {selectedHistory.patient.patient_name}
                </h3>
              </div>
              <button onClick={() => setSelectedHistory(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Header Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 block">Patient ID:</span>
                <span className="font-mono text-teal-800 font-bold">#{selectedHistory.patient.patient_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Blood Group:</span>
                <span className="font-bold text-rose-700">{selectedHistory.patient.blood_group}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone:</span>
                <span className="font-mono text-slate-700">{selectedHistory.patient.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Lifetime Spend (Func 1):</span>
                <span className="font-mono text-emerald-700 font-extrabold text-sm">
                  ₹{(selectedHistory.total_spend || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Visit Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Consultations ({selectedHistory.visits.length} Visits Recorded)
              </h4>

              {selectedHistory.visits.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No appointment records found for this patient.</p>
              ) : (
                selectedHistory.visits.map((v) => (
                  <div key={v.appt_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-teal-700 font-semibold">Appt #{v.appt_id}</span>
                        <span className="text-xs text-slate-500 font-mono">({v.appt_date} at {v.appt_time})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-800 font-semibold">{v.doc_name}</span>
                        <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{v.dept_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          v.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>{v.status}</span>
                      </div>
                    </div>

                    {v.diagnosis && (
                      <div className="text-xs text-slate-700">
                        <span className="text-slate-500 font-semibold">Diagnosis: </span>
                        <span>{v.diagnosis}</span>
                      </div>
                    )}

                    {/* Prescriptions */}
                    {v.prescriptions && v.prescriptions.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medication
                        </div>
                        <div className="space-y-1">
                          {v.prescriptions.map((pr) => (
                            <div key={pr.presc_id} className="flex justify-between items-center text-xs text-slate-700">
                              <span>• {pr.med_name} ({pr.dosage}) × {pr.quantity} units</span>
                              <span className="font-mono text-slate-500">₹{pr.line_total}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Associated Bill */}
                    {v.bill && (
                      <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-slate-700">Bill #{v.bill.bill_id} (Fee: ₹{v.bill.consultation_charge} + Meds: ₹{v.bill.medicine_charge})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700 text-sm">₹{v.bill.total_amount}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            v.bill.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>{v.bill.payment_status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
