import { useAppState } from '../context/AppContext';
import { roleNameMap } from '../types';
import type { UserRole } from '../types';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Download, Upload, RotateCcw } from 'lucide-react';
import { useRef } from 'react';

const roles: { role: UserRole; name: string; description: string }[] = [
  { role: 'VP', name: roleNameMap['VP'], description: 'Full access to all modules, dashboard, audit logs, and executive wallboard.' },
  { role: 'Intake Coordinator', name: roleNameMap['Intake Coordinator'], description: 'Referral pipeline, document management, eligibility tracking.' },
  { role: 'Scheduler', name: roleNameMap['Scheduler'], description: 'Staffing, shift board, staff assignment, route optimization.' },
  { role: 'Field Staff', name: roleNameMap['Field Staff'], description: 'Field assistant (visits, EVV, checklist), quality items assigned to you.' },
  { role: 'Compliance Admin', name: roleNameMap['Compliance Admin'], description: 'Credential compliance, audit logs, security checklist, notifications.' },
];

export default function SettingsPage() {
  const { state, setUser, addToast, resetState, exportState, importState, addAuditEntry } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoleChange = (role: UserRole) => {
    setUser({ name: roleNameMap[role], role });
    addToast(`Switched to ${roleNameMap[role]} (${role})`, 'info');
  };

  const handleResetDemoData = () => {
    resetState();
    addToast('Demo data reset to initial seed state', 'success');
  };

  const handleExportData = () => {
    const json = exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advisacare-demo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Exported', recordType: 'DemoData', recordId: 'all',
      details: 'Exported full demo state as JSON',
    });
    addToast('Demo data exported as JSON', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importState(data);
        addAuditEntry({
          user: state.currentUser.name, role: state.currentUser.role,
          action: 'Imported', recordType: 'DemoData', recordId: 'all',
          details: `Imported demo state from ${file.name}`,
        });
        addToast('Demo data imported successfully', 'success');
      } catch {
        addToast('Import failed — invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <h2 className="page-title flex items-center gap-2 mb-6">
        <SettingsIcon size={22} className="text-advisa-accent" />
        Settings
      </h2>

      {/* Current User */}
      <div className="card mb-5">
        <div className="card-header mb-3"><User size={15} /> Current User</div>
        <div className="flex items-center gap-4 p-3 bg-advisa-accent/5 rounded-lg border border-advisa-accent/20">
          <div className="w-12 h-12 bg-advisa-accent rounded-full flex items-center justify-center text-white text-lg font-bold">
            {state.currentUser.name.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{state.currentUser.name}</p>
            <p className="text-sm text-slate-500">{state.currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="card mb-5">
        <div className="card-header mb-3"><Shield size={15} /> Demo Role Switcher</div>
        <p className="text-xs text-slate-500 mb-4">
          Switch between roles to see how the Command Center adapts permissions, navigation, and data views.
          This is a demo feature — production would use SSO/authentication.
        </p>
        <div className="space-y-2">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => handleRoleChange(r.role)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${state.currentUser.role === r.role
                ? 'border-advisa-accent bg-sky-50 shadow-sm'
                : 'border-advisa-border bg-white hover:bg-slate-50'
              }`}
              data-testid={`role-${r.role.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {r.name}
                  <span className="text-xs text-slate-400 font-normal ml-2">({r.role})</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{r.description}</p>
              </div>
              {state.currentUser.role === r.role && (
                <span className="badge badge-success text-[10px]">Active</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="card mb-5">
        <div className="card-header mb-3"><Database size={15} /> Demo Data Management</div>
        <p className="text-xs text-slate-500 mb-4">
          App state persists to localStorage automatically. Use these controls to reset, export, or import demo data.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleResetDemoData}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
            data-testid="reset-demo-data"
          >
            <RotateCcw size={15} /> Reset Demo Data
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-advisa-border bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            data-testid="export-demo-data"
          >
            <Download size={15} /> Export Demo Data
          </button>
          <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-advisa-border bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload size={15} /> Import Demo Data
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              data-testid="import-demo-data"
            />
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-slate-50">
        <div className="card-header mb-2"><Bell size={15} /> About This Demo</div>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>All data is <strong>fake/demo</strong> — no real PHI is used or stored.</li>
          <li>State persists to <strong>localStorage</strong> — changes survive page reloads.</li>
          <li>Click <strong>Reset Demo Data</strong> to restore the original seed data.</li>
          <li>Role switching is client-side only. Production requires server-side RBAC.</li>
          <li>Notification Center (bell icon) shows alerts grouped by severity.</li>
          <li>Toast notifications replace all browser <code>alert()</code> calls.</li>
          <li>AI features are labeled as placeholders with demo-only notices.</li>
          <li>Audit logs capture all state changes with before/after values.</li>
        </ul>
      </div>
    </div>
  );
}
