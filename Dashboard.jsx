import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
  Stethoscope,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Balanced, professional healthcare palette
const PIE_COLORS = ['#0d9488', '#2563eb', '#6366f1', '#0284c7', '#d97706'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const { cards, revenueByDept, topMedicines, recentAppointments } = data || {};

  const cardList = [
    { title: 'Total Patients', value: cards?.totalPatients || 0, icon: Users, iconBg: 'bg-blue-50 text-blue-700 border-blue-100' },
    { title: 'Appointments Today', value: cards?.appointmentsToday || 0, icon: Calendar, iconBg: 'bg-teal-50 text-teal-700 border-teal-100' },
    { title: 'Revenue Collected', value: `₹${(cards?.totalRevenue || 0).toLocaleString()}`, icon: CreditCard, iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { title: 'Low Stock Medicines', value: cards?.lowStockMeds || 0, icon: AlertTriangle, iconBg: 'bg-amber-50 text-amber-700 border-amber-100' },
    { title: 'Active Doctors', value: cards?.totalDoctors || 0, icon: Stethoscope, iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { title: 'Pending Invoices', value: cards?.pendingBills || 0, icon: Clock, iconBg: 'bg-rose-50 text-rose-700 border-rose-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Management System
            </h1>
          </div>

        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cardList.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                <div className={`p-2 rounded-xl border ${c.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Department */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" /> Revenue by Department
              </h3>
              <p className="text-xs text-slate-500">Collected revenue aggregated across clinical departments</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDept} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="dept_name" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Prescribed Medicines */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" /> Top 5 Prescribed Medicines
              </h3>
              <p className="text-xs text-slate-500">Inventory quantity dispensed across clinical consultations</p>
            </div>
          </div>
          <div className="h-64 flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topMedicines}
                    dataKey="total_qty"
                    nameKey="med_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={48}
                    paddingAngle={3}
                  >
                    {topMedicines?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                    formatter={(val) => [`${val} units`, 'Quantity']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 pl-0 md:pl-4 space-y-2 mt-4 md:mt-0">
              {topMedicines?.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                    <span className="text-slate-700 font-medium truncate max-w-[140px]">{m.med_name}</span>
                  </div>
                  <span className="font-mono text-slate-600 font-semibold">{m.total_qty} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" /> Recent Appointments
          </h3>
          <span className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
            Live Synchronized
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Appt ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAppointments?.map((appt) => (
                <tr key={appt.appt_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-teal-700 font-semibold">#{appt.appt_id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{appt.patient_name}</td>
                  <td className="px-4 py-3 text-slate-700">{appt.doc_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{appt.appt_date} at {appt.appt_time}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      appt.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : appt.status === 'Scheduled'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic max-w-xs truncate">
                    {appt.diagnosis || 'Pending consultation'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
