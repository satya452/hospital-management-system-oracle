import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Pill,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle,
  X,
  Trash2
} from 'lucide-react';

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);

  // Forms
  const [medForm, setMedForm] = useState({
    med_name: '',
    manufacturer: '',
    unit_price: 10,
    stock_qty: 100,
  });

  const [restockForm, setRestockForm] = useState({
    add_qty: 50,
    new_price: '',
  });

  // Prescribe Multi-Item Form
  const [prescribeApptId, setPrescribeApptId] = useState('');
  const [prescribeItems, setPrescribeItems] = useState([
    { medicine_id: '', dosage: '1 tablet twice daily', duration_days: 7, quantity: 14 },
  ]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMedicines();
    fetchAppointments();
  }, [lowStockFilter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/medicines${lowStockFilter ? '?low_stock=true' : ''}`);
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
      if (res.data.length > 0 && !prescribeApptId) {
        setPrescribeApptId(res.data[0].appt_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/medicines', medForm);
      setShowAddMedModal(false);
      setMedForm({ med_name: '', manufacturer: '', unit_price: 10, stock_qty: 100 });
      setSuccessMsg('Medicine added to inventory successfully');
      fetchMedicines();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to add medicine');
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.put(`/medicines/${selectedMed.medicine_id}/restock`, {
        add_qty: parseInt(restockForm.add_qty) || 0,
        new_price: restockForm.new_price ? parseFloat(restockForm.new_price) : undefined,
      });
      setShowRestockModal(false);
      setSuccessMsg(`Restocked ${selectedMed.med_name}`);
      fetchMedicines();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Restock failed');
    }
  };

  const handleAddPrescribeRow = () => {
    setPrescribeItems([
      ...prescribeItems,
      { medicine_id: medicines[0]?.medicine_id || '', dosage: '1 tablet once daily', duration_days: 5, quantity: 10 },
    ]);
  };

  const handleRemovePrescribeRow = (index) => {
    if (prescribeItems.length <= 1) return;
    setPrescribeItems(prescribeItems.filter((_, i) => i !== index));
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/prescriptions', {
        appt_id: parseInt(prescribeApptId),
        items: prescribeItems.map((item) => ({
          medicine_id: parseInt(item.medicine_id || medicines[0]?.medicine_id),
          dosage: item.dosage,
          duration_days: parseInt(item.duration_days),
          quantity: parseInt(item.quantity),
        })),
      });
      setShowPrescribeModal(false);
      setSuccessMsg('Prescriptions issued! Inventory auto-decremented via Trigger 1.');
      fetchMedicines();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to issue prescriptions (Check medicine stock!)');
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      m.med_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-xs"
            />
          </div>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              lowStockFilter
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Filter (&lt; 50 qty)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setErrorMsg('');
              setShowAddMedModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            <span>Add Medicine</span>
          </button>

          <button
            onClick={() => {
              setErrorMsg('');
              setShowPrescribeModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            <span>Issue E-Prescription (FR5)</span>
          </button>
        </div>
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

      {/* Medicine Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Medicine Name</th>
                <th className="px-5 py-3.5">Manufacturer</th>
                <th className="px-5 py-3.5">Unit Price (₹)</th>
                <th className="px-5 py-3.5">Stock Level</th>
                <th className="px-5 py-3.5">Stock Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400">Loading pharmacy catalog...</td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">No medicines found.</td>
                </tr>
              ) : (
                filteredMedicines.map((m) => {
                  const isCritical = m.stock_qty < 50;
                  const isLow = m.stock_qty >= 50 && m.stock_qty < 200;
                  return (
                    <tr key={m.medicine_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 font-bold">#{m.medicine_id}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.med_name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{m.manufacturer || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-semibold">₹{m.unit_price.toFixed(2)}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {m.stock_qty} <span className="text-xs text-slate-400 font-normal">units</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isCritical ? 'CRITICAL LOW' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedMed(m);
                            setRestockForm({ add_qty: 50, new_price: m.unit_price });
                            setErrorMsg('');
                            setShowRestockModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer"
                        >
                          Restock / Price
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Medicine (FR6)</h3>
              <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name * (Unique)</label>
                <input
                  type="text"
                  required
                  value={medForm.med_name}
                  onChange={(e) => setMedForm({ ...medForm, med_name: e.target.value })}
                  placeholder="e.g. Amoxicillin 500mg"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={medForm.manufacturer}
                  onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                  placeholder="e.g. Cipla Ltd"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) * [&gt; 0]</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.5"
                    required
                    value={medForm.unit_price}
                    onChange={(e) => setMedForm({ ...medForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock * [&gt;= 0]</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={medForm.stock_qty}
                    onChange={(e) => setMedForm({ ...medForm, stock_qty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddMedModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs">Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Restock: {selectedMed.med_name}</h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRestock} className="space-y-3.5 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Current Inventory:</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedMed.stock_qty} units</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Current Unit Price:</span>
                  <span className="font-mono text-emerald-700 font-bold">₹{selectedMed.unit_price}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Stock Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockForm.add_qty}
                  onChange={(e) => setRestockForm({ ...restockForm, add_qty: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjust Unit Price (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.5"
                  value={restockForm.new_price}
                  onChange={(e) => setRestockForm({ ...restockForm, new_price: e.target.value })}
                  placeholder={`Current: ${selectedMed.unit_price}`}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRestockModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs">Apply Restock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Multi-Medicine E-Prescription Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  FR5 & Trigger 1 (Inventory Auto-Decrement)
                </div>
                <h3 className="text-xl font-bold text-slate-900">Issue E-Prescription</h3>
              </div>
              <button onClick={() => setShowPrescribeModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePrescribeSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Consultation Appointment *</label>
                <select
                  required
                  value={prescribeApptId}
                  onChange={(e) => setPrescribeApptId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {appointments.map((a) => (
                    <option key={a.appt_id} value={a.appt_id}>
                      Appt #{a.appt_id} — {a.patient_name} with {a.doc_name} ({a.appt_date}) [{a.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Prescription Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prescribed Items</span>
                  <button
                    type="button"
                    onClick={handleAddPrescribeRow}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Medicine
                  </button>
                </div>

                {prescribeItems.map((item, idx) => {
                  const currMed = medicines.find((m) => m.medicine_id === parseInt(item.medicine_id || medicines[0]?.medicine_id));
                  const isExceeding = currMed && item.quantity > currMed.stock_qty;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-teal-800 font-semibold">Item #{idx + 1}</span>
                        {prescribeItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrescribeRow(idx)}
                            className="text-rose-600 hover:text-rose-700 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-500 mb-1">Medicine</label>
                          <select
                            value={item.medicine_id || medicines[0]?.medicine_id}
                            onChange={(e) => {
                              const updated = [...prescribeItems];
                              updated[idx].medicine_id = e.target.value;
                              setPrescribeItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                          >
                            {medicines.map((m) => (
                              <option key={m.medicine_id} value={m.medicine_id}>
                                {m.med_name} (In stock: {m.stock_qty})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Duration (days)</label>
                          <input
                            type="number"
                            min="1"
                            value={item.duration_days}
                            onChange={(e) => {
                              const updated = [...prescribeItems];
                              updated[idx].duration_days = e.target.value;
                              setPrescribeItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-teal-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...prescribeItems];
                              updated[idx].quantity = e.target.value;
                              setPrescribeItems(updated);
                            }}
                            className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-slate-900 text-xs font-mono ${
                              isExceeding ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 focus:border-teal-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Dosage Instructions</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => {
                            const updated = [...prescribeItems];
                            updated[idx].dosage = e.target.value;
                            setPrescribeItems(updated);
                          }}
                          placeholder="e.g. 1 capsule thrice daily after meals"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      {isExceeding && (
                        <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Requested {item.quantity} exceeds available stock ({currMed.stock_qty})! Trigger 1 will reject.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowPrescribeModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs">
                  Submit Prescription & Decrement Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
