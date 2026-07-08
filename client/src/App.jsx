import React, { useState } from 'react';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, FileText, ClipboardList, ShieldAlert } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('report');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert size={32} className="text-secondary" />
            <h1 className="text-2xl font-bold tracking-tight">Crime Reporting & Analysis</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1 container mx-auto p-4 gap-6 flex-col md:flex-row">
        {/* Sidebar / Navigation */}
        <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'report' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <FileText size={20} />
              <span className="font-medium">Report Crime</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'list' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ClipboardList size={20} />
              <span className="font-medium">View Reports</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Analysis Dashboard</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[600px]">
          {activeTab === 'report' && <ReportForm onSuccess={() => setActiveTab('list')} />}
          {activeTab === 'list' && <ReportList />}
          {activeTab === 'dashboard' && <Dashboard />}
        </main>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-400 text-sm border-t border-slate-200 bg-white mt-auto">
        &copy; 2026 Crime Reporting and Analysis System. No demo data. Pure user-generated content.
      </footer>
    </div>
  );
}

export default App;
