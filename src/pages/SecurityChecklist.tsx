import { Lock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ChecklistItem {
  category: string;
  items: { label: string; status: 'Required' | 'Implemented (Demo)' | 'Planned' | 'N/A (Demo)' }[];
}

const checklist: ChecklistItem[] = [
  {
    category: 'Access Control',
    items: [
      { label: 'Role-based access control (RBAC) enforced server-side', status: 'Required' },
      { label: 'Multi-factor authentication (MFA)', status: 'Required' },
      { label: 'Automatic session timeout / logoff', status: 'Required' },
      { label: 'Unique user identification', status: 'Required' },
      { label: 'Client-side role-based navigation (demo RBAC)', status: 'Implemented (Demo)' },
    ],
  },
  {
    category: 'Data Protection',
    items: [
      { label: 'Encryption at rest (AES-256)', status: 'Required' },
      { label: 'Encryption in transit (TLS 1.2+)', status: 'Required' },
      { label: 'No real PHI in demo data', status: 'Implemented (Demo)' },
      { label: 'Data backup and recovery procedures', status: 'Required' },
      { label: 'Disaster recovery plan', status: 'Required' },
    ],
  },
  {
    category: 'Audit & Logging',
    items: [
      { label: 'Immutable audit logging (server-side)', status: 'Required' },
      { label: 'Client-side audit log with before/after values', status: 'Implemented (Demo)' },
      { label: 'Audit/security documentation retained at least 6 years where required; operational audit-log retention must be approved by compliance/legal and configured according to HIPAA, state law, payer rules, contracts, and company policy', status: 'Required' },
      { label: 'User activity tracking', status: 'Implemented (Demo)' },
    ],
  },
  {
    category: 'Agreements & Compliance',
    items: [
      { label: 'Business Associate Agreement (BAA)', status: 'Required' },
      { label: 'HIPAA Security Rule risk analysis', status: 'Required' },
      { label: 'HIPAA Privacy Rule policies', status: 'Required' },
      { label: 'State-specific health information privacy laws', status: 'Required' },
      { label: 'Employee security awareness training', status: 'Required' },
    ],
  },
  {
    category: 'Technical Security',
    items: [
      { label: 'Penetration testing', status: 'Required' },
      { label: 'Vulnerability scanning', status: 'Required' },
      { label: 'Intrusion detection/prevention', status: 'Required' },
      { label: 'Secure software development lifecycle (SDLC)', status: 'Planned' },
      { label: 'Secure backups with encryption', status: 'Required' },
    ],
  },
  {
    category: 'Incident Response',
    items: [
      { label: 'Security incident response plan', status: 'Required' },
      { label: 'Breach notification procedures aligned with HIPAA, applicable state law, contractual obligations, and company policy', status: 'Required' },
      { label: 'Sanctions policy for violations', status: 'Required' },
    ],
  },
];

const statusStyle: Record<string, { badge: string; icon: React.ReactNode }> = {
  'Required': { badge: 'badge-urgent', icon: <XCircle size={11} className="text-red-500" /> },
  'Implemented (Demo)': { badge: 'badge-success', icon: <CheckCircle size={11} className="text-emerald-500" /> },
  'Planned': { badge: 'badge-warning', icon: <AlertTriangle size={11} className="text-amber-500" /> },
  'N/A (Demo)': { badge: 'badge-neutral', icon: <AlertTriangle size={11} className="text-slate-400" /> },
};

export default function SecurityChecklist() {
  const total = checklist.reduce((s, c) => s + c.items.length, 0);
  const implemented = checklist.reduce((s, c) => s + c.items.filter(i => i.status === 'Implemented (Demo)').length, 0);
  const required = checklist.reduce((s, c) => s + c.items.filter(i => i.status === 'Required').length, 0);

  return (
    <div>
      <h2 className="page-title flex items-center gap-2 mb-2">
        <Lock size={22} className="text-advisa-accent" />
        Security & HIPAA Checklist
      </h2>
      <p className="text-xs text-slate-400 mb-6">
        {implemented}/{total} items implemented in demo · {required} require production implementation
      </p>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <strong>This is a demo/prototype.</strong> Items marked "Required" must be implemented before handling
          any real Protected Health Information (PHI). This checklist is for awareness only and does not constitute
          legal or compliance advice. Consult with qualified HIPAA compliance professionals.
        </div>
      </div>

      <div className="space-y-5">
        {checklist.map(category => (
          <div key={category.category} className="card">
            <div className="card-header mb-3">{category.category}</div>
            <div className="space-y-2">
              {category.items.map((item, idx) => {
                const style = statusStyle[item.status];
                return (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-700">{item.label}</p>
                    </div>
                    <span className={`badge ${style.badge} text-[9px] flex-shrink-0`}>{item.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
