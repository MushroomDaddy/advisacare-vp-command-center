import { useAppState } from '../context/AppContext';
import { useState } from 'react';

const roles = [
  { 
    id: 'vp', 
    name: 'VP', 
    roleKey: 'VP' as const,
    description: 'Full access to all modules and executive dashboard', 
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    permissions: ['Dashboard', 'Referrals', 'Staffing', 'Compliance', 'Field Assistant', 'Quality', 'Partners', 'Settings', 'Audit Log'],
  },
  { 
    id: 'intake', 
    name: 'Intake Coordinator', 
    roleKey: 'Intake Coordinator' as const,
    description: 'Manage referrals, documents, eligibility, and partner relations', 
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    permissions: ['Referrals', 'Partners'],
  },
  { 
    id: 'scheduler', 
    name: 'Scheduler', 
    roleKey: 'Scheduler' as const,
    description: 'View staffing, assign visits, manage schedules and field operations', 
    color: 'bg-green-100 text-green-700 border-green-300',
    permissions: ['Staffing', 'Field Assistant'],
  },
  { 
    id: 'field', 
    name: 'Field Staff', 
    roleKey: 'Field Staff' as const,
    description: 'View assigned visits, complete checklists, voice notes, and escalations', 
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    permissions: ['Field Assistant'],
  },
  { 
    id: 'compliance', 
    name: 'Compliance Admin', 
    roleKey: 'Compliance Admin' as const,
    description: 'Track licenses, training, certifications, and compliance audits', 
    color: 'bg-red-100 text-red-700 border-red-300',
    permissions: ['Compliance', 'Audit Log'],
  },
];

const allPages = ['Dashboard', 'Referrals', 'Staffing', 'Compliance', 'Field Assistant', 'Quality', 'Partners', 'Settings', 'Audit Log'];

export default function Settings() {
  const { state, addAuditEntry, setCurrentRole } = useAppState();
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [showRoleChange, setShowRoleChange] = useState(false);
  
  const handleRoleChange = (newRole: typeof roles[0]) => {
    // Update the current role in context
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
        <h2 className="text-2xl font-bold text-advisa-primary">Settings / Role-Based Access</h2>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-300">
          role-based access mockup
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role List */}
        <div className="card">
          <h3 className="font-semibold mb-4">Roles</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={"w-full text-left px-4 py-3 rounded-lg transition-all border " + 
                  (selectedRole.id === role.id 
                    ? "bg-advisa-accent text-white border-advisa-accent" 
                    : "hover:bg-gray-50 border-gray-200"
                  )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={"inline-block px-2 py-0.5 rounded text-xs font-medium " + role.color}>
                    {role.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Role Details */}
        <div className="card md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedRole.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedRole.description}</p>
            </div>
            <button 
              onClick={() => setShowRoleChange(!showRoleChange)}
              className="px-3 py-1.5 bg-advisa-primary text-white rounded-lg text-xs hover:bg-advisa-secondary"
            >
              Switch to this Role
            </button>
          </div>
          
          <h4 className="font-medium mb-3">Permissions</h4>
          <div className="grid grid-cols-2 gap-2">
            {allPages.map((page) => {
              const hasAccess = selectedRole.permissions.includes(page);
              return (
                <div key={page} className={"flex items-center gap-2 p-2 rounded " + (hasAccess ? "bg-green-50" : "bg-gray-50")}>
                  <span className={hasAccess ? "text-hipaa-green" : "text-gray-400"}>
                    {hasAccess ? "✓" : "✗"}
                  </span>
                  <span className={hasAccess ? "text-gray-700" : "text-gray-400"}>{page}</span>
                </div>
              );
            })}
          </div>

          {/* Role Change Confirmation */}
          {showRoleChange && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-medium text-yellow-800 mb-2">Confirm Role Switch</p>
              <p className="text-sm text-yellow-700 mb-3">
                You are about to switch to <strong>{selectedRole.name}</strong> role. This will change your available permissions.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRoleChange(selectedRole)}
                  className="px-4 py-2 bg-advisa-accent text-white rounded-lg text-sm"
                >
                  Confirm Switch
                </button>
                <button 
                  onClick={() => setShowRoleChange(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">⚙️ Current User</p>
            <p className="text-sm text-blue-700 mt-1">
              Logged in as: <strong>{state.currentUser.name}</strong> ({state.currentUser.role})
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">⚠️ This is a role-based access mockup. In production:</p>
        <ul className="text-xs text-yellow-700 mt-2 space-y-1">
          <li>• Implement proper authentication (OAuth 2.0, OIDC)</li>
          <li>• Use session management with secure cookies/JWT</li>
          <li>• Store roles in your backend database</li>
          <li>• Implement server-side permission checks</li>
          <li>• Add MFA for sensitive roles (VP, Compliance Admin)</li>
        </ul>
      </div>
    </div>
  );
}
