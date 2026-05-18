import { useAppState } from '../context/AppContext';
import { allRoles, allResources, allCRUDActions, hasPermission } from '../lib/permissions';
import type { UserRole } from '../types';
import { Settings as SettingsIcon, ShieldCheck, Eye, Pencil, Plus, Trash2, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { state, setCurrentRole, addAuditEntry } = useAppState();

  const handleRoleChange = (role: UserRole) => {
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'User',
      recordId: state.currentUser.name,
      details: `[Demo] Role switched from ${state.currentUser.role} to ${role}`,
      before: state.currentUser.role,
      after: role,
    });
    setCurrentRole(role);
  };

  const actionIcons: Record<string, React.ReactNode> = {
    view: <Eye size={10} />,
    edit: <Pencil size={10} />,
    create: <Plus size={10} />,
    delete: <Trash2 size={10} />,
    export: <Download size={10} />,
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <SettingsIcon size={22} className="text-advisa-accent" />
          Settings
        </h2>
      </div>

      {/* Demo Role Switcher */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-amber-500" />
          <p className="section-title">Demo Role Switcher</p>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          ⚠ This is a demo feature for prototype testing only. In production, roles would be managed by an admin
          through proper identity/access management.
        </p>
        <div className="flex flex-wrap gap-2">
          {allRoles.map(role => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${state.currentUser.role === role
                ? 'bg-advisa-accent text-white border-advisa-accent shadow-sm'
                : 'bg-white text-slate-600 border-advisa-border hover:bg-slate-50'
                }`}
            >
              {role}
            </button>
          ))}
        </div>
        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <p>Current role: <strong>{state.currentUser.role}</strong></p>
          <p>User: <strong>{state.currentUser.name}</strong></p>
        </div>
      </div>

      {/* CRUD Permission Grid */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} className="text-advisa-accent" />
          <p className="section-title">CRUD Permission Grid</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Shows the CRUD permissions for the currently selected role: <strong>{state.currentUser.role}</strong>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="table-head">Resource</th>
                {allCRUDActions.map(action => (
                  <th key={action} className="table-head text-center">
                    <div className="flex items-center justify-center gap-1">{actionIcons[action]} {action}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResources.map(resource => (
                <tr key={resource} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium text-slate-700">{resource}</td>
                  {allCRUDActions.map(action => (
                    <td key={action} className="table-cell text-center">
                      {hasPermission(state.currentUser.role, resource, action) ? (
                        <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle size={14} className="text-red-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
