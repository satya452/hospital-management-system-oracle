import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Pill,
  Receipt,
  Layers,
  Database,
  HeartPulse,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Doctors & Depts', path: '/doctors', icon: Stethoscope },
  { name: 'Appointments', path: '/appointments', icon: CalendarDays },
  { name: 'Pharmacy & Presc.', path: '/pharmacy', icon: Pill },
  { name: 'Billing & Invoicing', path: '/billing', icon: Receipt },
  { name: 'Transactions', path: '/transactions', icon: Layers, highlight: true },
  { name: 'SQL Query Engine', path: '/sql', icon: Database },
];

export default function Sidebar() {
  return (
    <aside
      className="w-64 flex flex-col shrink-0 min-h-screen"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Brand Header */}
      <div
        className="p-6 flex items-center space-x-3"
        style={{ borderBottom: '1px solid var(--border-light)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/10 font-bold flex-shrink-0">
          <HeartPulse className="w-5 h-5" />
        </div>
        <div>
          <h1
            className="font-extrabold text-lg tracking-tight flex items-center gap-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            HMS{' '}
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: 'var(--teal-badge-bg)',
                border: '1px solid var(--teal-badge-border)',
                color: 'var(--teal-badge-text)',
              }}
            >
              v2.0
            </span>
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Hospital Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-6 space-y-1 overflow-y-auto">
        <div
          className="text-[11px] font-semibold tracking-wider uppercase px-3 mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Clinical Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${item.highlight ? 'relative' : ''} ${isActive ? 'nav-active' : 'nav-inactive'}`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                    backgroundColor: 'var(--teal-badge-bg)',
                    border: '1px solid var(--teal-badge-border)',
                    color: 'var(--teal-badge-text)',
                    fontWeight: 600,
                  }
                  : {
                    color: 'var(--text-secondary)',
                    border: '1px solid transparent',
                  }
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
              {item.highlight && (
                <span className="ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
