import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { UserRole } from '../types';
import { useState, useRef } from 'react';
import {
  Settings, User, Shield, Database, Download, Upload, RotateCcw,
  CheckCircle, Clock, AlertTriangle, Lock,
} from 'lucide-react';

const ROLES: UserRole[] = ['VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'];

export default function SettingsPage() {
  const { state, setCurrentRole, resetDemoData, exportDemoData, importDemoData } = useAppState();
  const { showToast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    showToast(`Role changed to ${role}`, 'success');
  };

  const handleExport = () => {
    const json = exportDemoData();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `advisacare-demo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Demo data exported', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importDemoData(text);
      if (success) {
        showToast('Demo data imported successfully', 'success');
      } else {
        showToast('Invalid data file — import failed', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    resetDemoData();
    showToast('Demo data reset to seed state', 'success');
    setShowResetConfirm(false);
  };

  const statusIcon = (status: string) => {
    if (status === 'Implemented in Demo') return <CheckCircle size={13} className="text-emerald-500" />;
    if (status === 'Planned') return <Clock size={13} className="text-amber-500" />;
    if (status === 'Production Required') return <AlertTriangle size={13} className="text-red-500" />;
    return <Lock size={13} className="text-slate-400" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'Implemented in Demo') return 'badge-success';
    if (status === 'Planned') return 'badge-warning';
    if (status === 'Production Required') return 'badge-urgent';
    return 'badge-neutral';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Settings size={22} className="text-advisa-accent" />
          Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Demo settings, role switching, data management</p>
      </div>

      {/* Role Switching */}
      <div className="card mb-5">
        <div className="card-header"><User size={16} className="text-advisa-accent" />Role Switching (Demo)</div>
        <p className="text-xs text-slate-500 mb-3">Switch roles to see how the interface adapts. Some pages are restricted based on role.</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                state.currentUser.role === role
                  ? 'bg-advisa-accent text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">Current: <strong>{state.currentUser.name}</strong> as <strong>{state.currentUser.role}</strong></p>
      </div>

      {/* Demo Data Management */}
      <div className="card mb-5">
        <div className="card-header"><Database size={16} className="text-advisa-accent" />Demo Data Management</div>
        <p className="text-xs text-slate-500 mb-4">Manage your demo state. Data persists in localStorage. Seed data only resets when you explicitly reset.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={handleExport} className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
            <Download size={18} className="text-emerald-600" />
            <div className="text-left">
              <p className="text-xs font-bold text-emerald-700">Export Demo Data</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Download as JSON</p>
            </div>
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-4 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors">
            <Upload size={18} className="text-sky-600" />
            <div className="text-left">
              <p className="text-xs font-bold text-sky-700">Import Demo Data</p>
              <p className="text-[10px] text-sky-600 mt-0.5">Load from JSON file</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <RotateCcw size={18} className="text-red-600" />
            <div className="text-left">
              <p className="text-xs font-bold text-red-700">Reset Demo Data</p>
              <p className="text-[10px] text-red-600 mt-0.5">Restore seed state</p>
            </div>
          </button>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
          <p><strong>State:</strong> {state.referrals.length} referrals, {state.staff.length} staff, {state.compliance.length} compliance items, {state.alerts.length} alerts, {state.shifts.length} shifts, {state.auditLog.length} audit entries</p>
        </div>
      </div>

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowResetConfirm(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-red-700 mb-2">Reset All Demo Data?</h3>
            <p className="text-xs text-slate-600 mb-4">This will clear all your changes and restore the original seed data. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Reset Everything</button>
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Production Readiness Checklist */}
      <div className="card mb-5">
        <div className="card-header"><Shield size={16} className="text-advisa-accent" />Production Readiness Checklist</div>
        <p className="text-xs text-slate-500 mb-4">Track what's needed to move from demo to production-ready HIPAA-compliant system.</p>

        <div className="space-y-2">
          {state.productionReadiness.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2.5">
                {statusIcon(item.status)}
                <span className="text-xs text-slate-700">{item.feature}</span>
              </div>
              <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <p className="text-lg font-bold text-emerald-600">{state.productionReadiness.filter(i => i.status === 'Implemented in Demo').length}</p>
            <p className="text-[10px] text-emerald-700">In Demo</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <p className="text-lg font-bold text-amber-600">{state.productionReadiness.filter(i => i.status === 'Planned').length}</p>
            <p className="text-[10px] text-amber-700">Planned</p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-lg font-bold text-red-600">{state.productionReadiness.filter(i => i.status === 'Production Required').length}</p>
            <p className="text-[10px] text-red-700">Prod Required</p>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg">
            <p className="text-lg font-bold text-slate-600">{state.productionReadiness.filter(i => i.status === 'Not Started').length}</p>
            <p className="text-[10px] text-slate-600">Not Started</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Demo Data Only</p>
            <p className="text-xs text-amber-700 mt-1">This application uses simulated data stored in your browser's localStorage. No real PHI is processed. Before any production use, complete the HIPAA production readiness checklist above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
