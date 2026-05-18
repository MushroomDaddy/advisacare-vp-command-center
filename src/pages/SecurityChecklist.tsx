import { Lock, XCircle, AlertTriangle, Shield, Server, Key, Eye, Archive, RefreshCcw, Clock, FileText } from 'lucide-react';

const securityItems = [
  {
    category: 'Access Control',
    items: [
      { label: 'Business Associate Agreement (BAA) signed with all vendors', status: 'required', icon: <FileText size={13} /> },
      { label: 'Multi-Factor Authentication (MFA) for all users', status: 'required', icon: <Key size={13} /> },
      { label: 'Server-side RBAC enforcing least-privilege access', status: 'required', icon: <Shield size={13} /> },
      { label: 'Automatic session logoff after inactivity', status: 'required', icon: <Clock size={13} /> },
      { label: 'Unique user IDs with no shared accounts', status: 'required', icon: <Eye size={13} /> },
    ],
  },
  {
    category: 'Data Protection',
    items: [
      { label: 'Encryption at rest (AES-256 or equivalent)', status: 'required', icon: <Lock size={13} /> },
      { label: 'Encryption in transit (TLS 1.2+)', status: 'required', icon: <Lock size={13} /> },
      { label: 'PHI data masking in non-production environments', status: 'required', icon: <Eye size={13} /> },
      { label: 'Secure backups with tested restore procedures', status: 'required', icon: <Archive size={13} /> },
    ],
  },
  {
    category: 'Audit & Monitoring',
    items: [
      { label: 'Immutable audit logging (tamper-evident, append-only)', status: 'required', icon: <FileText size={13} /> },
      { label: 'Real-time intrusion detection / monitoring', status: 'required', icon: <AlertTriangle size={13} /> },
      { label: 'Audit logs retained for minimum 6 years', status: 'required', icon: <Archive size={13} /> },
      { label: 'Regular log review by designated security officer', status: 'required', icon: <Eye size={13} /> },
    ],
  },
  {
    category: 'Disaster Recovery',
    items: [
      { label: 'Documented disaster recovery plan', status: 'required', icon: <RefreshCcw size={13} /> },
      { label: 'Regular DR drills and documentation', status: 'required', icon: <RefreshCcw size={13} /> },
      { label: 'RPO and RTO defined and tested', status: 'required', icon: <Clock size={13} /> },
    ],
  },
  {
    category: 'Compliance',
    items: [
      { label: 'Annual HIPAA Security Risk Assessment', status: 'required', icon: <Shield size={13} /> },
      { label: 'Security awareness training for all staff', status: 'required', icon: <FileText size={13} /> },
      { label: 'Incident response plan documented and tested', status: 'required', icon: <AlertTriangle size={13} /> },
      { label: 'Physical safeguards for servers/workstations', status: 'required', icon: <Server size={13} /> },
      { label: 'Full HIPAA / security review before real PHI', status: 'required', icon: <Shield size={13} /> },
    ],
  },
];

export default function SecurityChecklist() {
  const totalItems = securityItems.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Lock size={22} className="text-advisa-accent" />
          Production Security Checklist
        </h2>
        <p className="text-xs text-slate-400 mt-1">{totalItems} requirements · All pending implementation</p>
      </div>

      {/* Warning Banner */}
      <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-600" />
          <p className="text-sm font-bold text-red-800">⚠ Not for Production Use</p>
        </div>
        <p className="text-xs text-red-700 leading-relaxed">
          This application is a <strong>HIPAA-conscious prototype</strong> using demo data only. Before handling any
          real Protected Health Information (PHI), every item on this checklist must be fully implemented, tested,
          and verified by qualified security professionals. This prototype does not meet HIPAA Security Rule requirements.
        </p>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-4">
        {securityItems.map(cat => (
          <div key={cat.category} className="card">
            <p className="section-title mb-3 flex items-center gap-2">
              <Shield size={14} className="text-advisa-accent" />
              {cat.category}
            </p>
            <div className="space-y-1.5">
              {cat.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400">{item.icon}</span>
                  <span className="flex-1 text-sm text-slate-700">{item.label}</span>
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    <XCircle size={13} /> Required
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Demo Login Note */}
      <div className="card mt-5 bg-slate-50">
        <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-slate-500" /><p className="section-title">Demo Login</p></div>
        <p className="text-xs text-slate-500 leading-relaxed">
          This prototype uses a demo role selector (Settings → Demo Role Switcher) instead of a real login system.
          In production, a proper authentication system with SSO/MFA, session management, and secure credential storage
          would be required. The current role switching mechanism is for demonstration purposes only and provides
          no actual security.
        </p>
      </div>
    </div>
  );
}
