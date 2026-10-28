import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Transactions from './pages/Transactions';
import SqlRunner from './pages/SqlRunner';

export default function App() {
  return (
    <ThemeProvider>
      <div
        className="flex min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Workspace */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Header />

          <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/sql" element={<SqlRunner />} />
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
