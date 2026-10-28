import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Receipt,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [completedAppts, setCompletedAppts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Bill Details Modal
  const [selectedBill, setSelectedBill] = useState(null);

  // Generate Bill Modal (Procedure 1)
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genApptId, setGenApptId] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchBills();
    fetchCompletedAppts();
  }, [statusFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bills${statusFilter ? `?status=${statusFilter}` : ''}`);
      setBills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedAppts = async () => {
    try {
      const res = await api.get('/appointments?status=Completed');
      setCompletedAppts(res.data);
      if (res.data.length > 0 && !genApptId) {
        setGenApptId(res.data[0].appt_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewBillDetails = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      setSelectedBill(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPaid = async (billId) => {
    try {
      await api.put(`/bills/${billId}/pay`);
      setSuccessMsg(`Bill #${billId} payment recorded as Paid.`);
      fetchBills();
      if (selectedBill && selectedBill.bill_id === billId) {
        setSelectedBill({ ...selectedBill, payment_status: 'Paid' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post(`/bills/generate/${genApptId}`);
      setShowGenerateModal(false);
      setSuccessMsg(`Procedure 1 executed! Bill #${res.data.bill_id} generated.`);
      fetchBills();
      viewBillDetails(res.data.bill_id);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to execute auto-bill procedure');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 shadow-xs"
          >
            <option value="">All Invoices (Paid & Pending)</option>
            <option value="Paid">Paid Invoices Only</option>
            <option value="Pending">Pending / Unpaid Only</option>
          </select>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setShowGenerateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>Execute Auto-Bill Generator (Proc 1)</span>
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

      {/* Bills Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Bill ID</th>
                <th className="px-5 py-3.5">Appt Ref</th>
                <th className="px-5 py-3.5">Patient Name</th>
                <th className="px-5 py-3.5">Attending Doctor</th>
                <th className="px-5 py-3.5">Consultation Fee</th>
                <th className="px-5 py-3.5">Medicines Charge</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-500">No bills found.</td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.bill_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-teal-700 font-bold">#{b.bill_id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">Appt #{b.appt_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{b.patient_name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">{b.doc_name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">₹{b.consultation_charge.toFixed(2)}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">₹{b.medicine_charge.toFixed(2)}</td>
                    <td className="px-5 py-3.5 font-mono font-extrabold text-emerald-700 text-sm">
                      ₹{b.total_amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        b.payment_status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {b.payment_status === 'Paid' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => viewBillDetails(b.bill_id)}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold cursor-pointer"
                      >
                        Itemized View
                      </button>
                      {b.payment_status === 'Pending' && (
                        <button
                          onClick={() => handleMarkPaid(b.bill_id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Invoice Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Invoice #{selectedBill.bill_id}</h3>
                  <p className="text-xs text-slate-500">Date: {selectedBill.bill_date} • Appt Ref: #{selectedBill.appt_id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Bill Meta */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Patient Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedBill.patient_name}</span>
                <span className="text-slate-500 block font-mono">{selectedBill.patient_phone}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Attending Doctor:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedBill.doc_name}</span>
                <span className="text-slate-500 block">{selectedBill.specialization} ({selectedBill.dept_name})</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line-Item Charges</h4>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Item Description</th>
                      <th className="px-4 py-2.5">Rate</th>
                      <th className="px-4 py-2.5">Qty</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Consultation Charge */}
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        Doctor Consultation Charge ({selectedBill.doc_name})
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">₹{selectedBill.consultation_charge.toFixed(2)}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">1</td>
                      <td className="px-4 py-2.5 font-mono text-right text-slate-900 font-semibold">₹{selectedBill.consultation_charge.toFixed(2)}</td>
                    </tr>

                    {/* Prescribed Medicines */}
                    {selectedBill.items?.map((item) => (
                      <tr key={item.presc_id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          Pharmacy: {item.med_name} <span className="text-slate-500">({item.dosage})</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">₹{item.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{item.quantity}</td>
                        <td className="px-4 py-2.5 font-mono text-right text-slate-900 font-semibold">₹{item.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Payment Status:</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  selectedBill.payment_status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  ● {selectedBill.payment_status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Invoice Amount:</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{selectedBill.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {selectedBill.payment_status === 'Pending' && (
                <button
                  onClick={() => handleMarkPaid(selectedBill.bill_id)}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Record Payment (Mark as Paid)
                </button>
              )}
              <button
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Bill Generator Modal (Procedure 1) */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  Procedure 1: Auto-Bill Generator
                </div>
                <h3 className="text-lg font-bold text-slate-900">Generate Appointment Invoice</h3>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGenerateBill} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Completed Appointment *</label>
                <select
                  required
                  value={genApptId}
                  onChange={(e) => setGenApptId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                >
                  {completedAppts.map((a) => (
                    <option key={a.appt_id} value={a.appt_id}>
                      Appt #{a.appt_id} — {a.patient_name} with {a.doc_name} ({a.appt_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                ℹ Procedure 1 calculates <code>consultation_charge + SUM(medicine unit_price * quantity)</code> and inserts/updates the <code>BILL</code> table snapshot record atomically.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowGenerateModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs">Execute Procedure 1</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
