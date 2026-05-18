import { useAppState } from '../context/AppContext';
import { allRoutes, getPermissionsForRole } from '../lib/permissions';
import { useState } from 'react';
import type { UserRole } from '../types';
import { Settings as SettingsIcon, Check, X, ShieldAlert, User, ArrowRightLeft } from 'lucide-react';

const roles: { id: string; name: string; roleKey: UserRole; description: string }[] = [
  { id: 'vp', name: 'VP', roleKey: 'VP', description: 'Full access to all modules and executive dashboard' },
  { id: 'intake', name: 'Intake Coordinator', roleKey: 'Intake Coordinator', description: 'Manage referrals, documents, eligibility, and partner relations' },
  { id: 'scheduler', name: 'Scheduler', roleKey: 'Scheduler', description: 'View staffing, assign visits, manage schedules' },
  { id: 'field', name: 'Field Staff', roleKey: 'Field Staff', description: 'View assigned visits, checklists, voice notes' },
  { id: 'compliance', name: 'Compliance Admin', roleKey: 'Compliance Admin', description: 'Track licenses, training, certifications' },
];

const allPageLabels = allRoutes.map(r => r.label);

export default function Settings() {
  const { state, addAuditEntry, setCurrentRole } = useAppState();
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [showRoleChange, setShowRoleChange] = useState(false);
  
  const selectedPermissions = getPermissionsForRole(selectedRole.roleKey);

  const handleRoleChange = (newRole: typeof roles[0]) => {
    setCurrentRole(newRole.roleKey);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Staff',
      recordId: 'user-' + Date.now(),
      details: `Role changed to ${newRole.name}`,
    });
    setShowRoleChange(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="page-title flex items-center gap-2">
          <SettingsIcon size={22} className="text-advisa-accent" />
          Settings
        </h2>
        <span className="badge badge-neutral">Role-Based Access Mockup</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card">
          <p className="section-title mb-3">Roles</p>
          <div className="space-y-1.5">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border text-sm ${
                  selectedRole.id === role.id
                    ? 'bg-advisa-accent text-white border-advisa-accent shadow-md shadow-advisa-accent/20'
                    : 'hover:bg-slate-50 border-advisa-border'
                }`}
              >
                <p className="font-semibold text-xs">{role.name}</p>
                <p className={`text-[10px] mt-0.5 ${selectedRole.id === role.id ? 'text-sky-100' : 'text-slate-400'}`}>{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-lg font-bold text-slate-800">{selectedRole.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
            </div>
            <button onClick={() => setShowRoleChange(!showRoleChange)} className="btn-primary text-xs py-1.5">
              <ArrowRightLeft size={13} />Switch Role
            </button>
          </div>
          
          <p className="section-title mb-2">Page Access</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {allPageLabels.map((page) => {
              const hasAccess = selectedPermissions.includes(page);
              return (
                <div key={page} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${hasAccess ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                  {hasAccess ? <Check size={13} /> : <X size={13} />}
                  {page}
                </div>
              );
            })}
          </div>

          {showRoleChange && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Confirm Role Switch</p>
              <p className="text-[11px] text-amber-700 mb-2">Switch to <strong>{selectedRole.name}</strong>? Permissions will change.</p>
              <div className="flex gap-2">
                <button onClick={() => handleRoleChange(selectedRole)} className="btn-primary text-xs py-1.5">Confirm</button>
                <button onClick={() => setShowRoleChange(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
              </div>
            </div>
          )}

          <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><User size={13} className="text-sky-600" /><p className="text-xs font-semibold text-sky-800">Current Session</p></div>
            <p className="text-xs text-sky-700">{state.currentUser.name} — {state.currentUser.role}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 card bg-slate-50">
        <div className="flex items-center gap-2 mb-2"><ShieldAlert size={14} className="text-slate-500" /><p className="text-xs font-semibold text-slate-600">Production Security Notes</p></div>
        <ul className="text-[11px] text-slate-500 space-y-1">
          <li>• Implement OAuth 2.0 / OIDC with server-side session management</li>
          <li>• Store roles in backend database with server-side permission checks</li>
          <li>• Add MFA for sensitive roles (VP, Compliance Admin)</li>
          <li>• Secure cookies/JWT with proper expiration</li>
        </ul>
      </div>
    </div>
  );
}
