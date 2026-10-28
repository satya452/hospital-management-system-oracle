import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const titleMap = {
  '/': 'Clinical Dashboard & Reporting',
  '/patients': 'Patient Management & Records (FR1)',
  '/doctors': 'Doctor & Department Directory (FR2)',
  '/appointments': 'Appointment Scheduling & Conflict Guard (FR3/FR4)',
  '/pharmacy': 'Medicine Inventory & E-Prescriptions (FR5/FR6)',
  '/billing': 'Automated Invoicing & Revenue (FR7)',
  '/transactions': 'Real-World Transactions',
  '/sql': 'Interactive SQL Query Runner & 17 Predefined Queries (FR8)',
};

export default function Header() {
  const location = useLocation();
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pageTitle = titleMap[location.pathname] || 'Hospital Management System';

  return (
    <header
      className="h-16 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2
          className="text-base md:text-lg font-bold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4 text-sm">
        {/* Clock */}
        <div
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border)',
          }}
        >
          <Clock className="w-3.5 h-3.5 text-teal-500" />
          <span
            className="font-mono text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {time}
          </span>
        </div>

        {/* DB Integrity badge */}
        <div
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{
            backgroundColor: 'var(--emerald-bg)',
            border: '1px solid var(--emerald-border)',
            color: 'var(--emerald-text)',
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--emerald-text)' }} />
          <span>DB Integrity Active</span>
        </div>

        {/* ── Dark / Light toggle ── */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
          className={`theme-toggle ${isDark ? 'dark-mode' : 'light'}`}
        >
          <span className="theme-toggle-knob">
            {isDark ? '🌙' : '☀️'}
          </span>
        </button>
      </div>
    </header>
  );
}
