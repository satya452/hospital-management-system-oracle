import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Building,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  DollarSign,
  X,
  AlertCircle
} from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [specSearch, setSpecSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);

  // Availability test widget (Function 2)
  const [availDocId, setAvailDocId] = useState('');
  const [availDate, setAvailDate] = useState(new Date().toISOString().split('T')[0]);
  const [availTime, setAvailTime] = useState('09:00');
  const [availResult, setAvailResult] = useState(null);
  const [availChecking, setAvailChecking] = useState(false);

  // Form states
  const [docForm, setDocForm] = useState({
    doc_name: '',
    specialization: '',
    phone: '',
    email: '',
    consultation_fee: 500,
    dept_id: '',
  });

  const [deptForm, setDeptForm] = useState({
    dept_name: '',
    location: '',
    phone: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedDept, specSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDept) params.append('dept_id', selectedDept);
      if (specSearch) params.append('specialization', specSearch);

      const [docsRes, deptsRes] = await Promise.all([
        api.get(`/doctors?${params.toString()}`),
        api.get('/departments')
      ]);
      setDoctors(docsRes.data);
    console.log('✅ Fetched doctors count:', docsRes.data.length);
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0 && !docForm.dept_id) {
        setDocForm((prev) => ({ ...prev, dept_id: deptsRes.data[0].dept_id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = docForm.phone ? docForm.phone.trim() : '';
    const cleanEmail = docForm.email ? docForm.email.trim() : '';

    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMsg('Mobile number must be exactly 10 digits (numbers only).');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address containing an @ symbol (e.g. name@domain.com).');
      return;
    }

    try {
      if (editDoctor) {
        await api.put(`/doctors/${editDoctor.doctor_id}`, { ...docForm, phone: cleanPhone, email: cleanEmail });
      } else {
        await api.post('/doctors', { ...docForm, phone: cleanPhone, email: cleanEmail });
      }
      setShowDoctorModal(false);
      setEditDoctor(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save doctor');
    }
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/departments', deptForm);
      setShowDeptModal(false);
      setDeptForm({ dept_name: '', location: '', phone: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create department');
    }
  };

  const checkAvailability = async (e) => {
    e.preventDefault();
    if (!availDocId) return;
    try {
      setAvailChecking(true);
      const res = await api.get(`/doctors/${availDocId}/availability?date=${availDate}&time=${availTime}`);
      setAvailResult(res.data.available);
    } catch (err) {
      console.error(err);
    } finally {
      setAvailChecking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Filter and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search specialization..."
              value={specSearch}
              onChange={(e) => setSpecSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-xs"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 shadow-xs"
          >
            <option value="">All Clinical Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setErrorMsg('');
              setShowDeptModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Building className="w-4 h-4 text-teal-700" />
            <span>Add Department</span>
          </button>

          <button
            onClick={() => {
              setEditDoctor(null);
              setDocForm({ doc_name: '', specialization: '', phone: '', email: '', consultation_fee: 500, dept_id: departments[0]?.dept_id || '' });
              setErrorMsg('');
              setShowDoctorModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor (FR2)</span>
          </button>
        </div>
      </div>

      {/* Live Doctor Availability Widget (Function 2: Check Doctor Availability) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Function 2 Tester: Doctor Availability Checker</h4>
              <p className="text-xs text-slate-500">Validates slot collision in real time before scheduling</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
            PL/SQL Function
          </span>
        </div>

        <form onSubmit={checkAvailability} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <select
            required
            value={availDocId}
            onChange={(e) => { setAvailDocId(e.target.value); setAvailResult(null); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white"
          >
            <option value="">Select Doctor...</option>
            {doctors.map((d) => (
              <option key={d.doctor_id} value={d.doctor_id}>{d.doc_name} ({d.dept_name})</option>
            ))}
          </select>

          <input
            type="date"
            required
            value={availDate}
            onChange={(e) => { setAvailDate(e.target.value); setAvailResult(null); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white"
          />

          <select
            value={availTime}
            onChange={(e) => { setAvailTime(e.target.value); setAvailResult(null); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white"
          >
            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={availChecking}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            {availChecking ? 'Checking...' : 'Check Slot Availability'}
          </button>
        </form>

        {availResult !== null && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
            {availResult ? (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold w-full">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Doctor is AVAILABLE at {availTime} on {availDate}.</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold w-full">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Doctor has an overlapping appointment at {availTime} on {availDate}! Slot is BUSY.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500">No doctors found matching filters.</div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc.doctor_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    ID #{doc.doctor_id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{doc.doc_name}</h3>
                  <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  {doc.dept_name}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                  <span className="font-mono text-slate-700 font-medium">{doc.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                  <span className="text-slate-700 truncate max-w-[180px]">{doc.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Consultation Fee</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">₹{doc.consultation_fee}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Joined: {doc.joining_date}</span>
                <button
                  onClick={() => {
                    setEditDoctor(doc);
                    setDocForm({
                      doc_name: doc.doc_name,
                      specialization: doc.specialization,
                      phone: doc.phone,
                      email: doc.email,
                      consultation_fee: doc.consultation_fee,
                      dept_id: doc.dept_id,
                    });
                    setErrorMsg('');
                    setShowDoctorModal(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer"
                >
                  Edit Fee / Info
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editDoctor ? `Edit ${editDoctor.doc_name}` : 'Add New Doctor (FR2)'}
              </h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDoctor} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={docForm.doc_name}
                  onChange={(e) => setDocForm({ ...docForm, doc_name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={docForm.dept_id}
                  onChange={(e) => setDocForm({ ...docForm, dept_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
                <input
                  type="text"
                  required
                  value={docForm.specialization}
                  onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                  placeholder="e.g. Neurosurgery"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mobile Number * (Unique)</label>
                    <span className="text-[10px] text-slate-400 font-mono">{docForm.phone.length}/10</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    value={docForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setDocForm({ ...docForm, phone: val });
                    }}
                    placeholder="e.g. 9876500001 (10 digits)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email * (Unique, must contain @)</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hms.in"
                    pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
                    title="Please enter a valid email address containing an @ symbol"
                    value={docForm.email}
                    onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (₹) * [CHECK &gt;= 0]</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={docForm.consultation_fee}
                  onChange={(e) => setDocForm({ ...docForm, consultation_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.dept_name}
                  onChange={(e) => setDeptForm({ ...deptForm, dept_name: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Floor</label>
                <input
                  type="text"
                  value={deptForm.location}
                  onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                  placeholder="e.g. Building A, Floor 2"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Extension / Phone</label>
                <input
                  type="text"
                  value={deptForm.phone}
                  onChange={(e) => setDeptForm({ ...deptForm, phone: e.target.value })}
                  placeholder="e.g. 011-2001"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
