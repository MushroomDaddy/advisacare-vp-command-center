import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AppProvider, useAppState } from './context/AppContext';
import { useState, useMemo } from 'react';
import Dashboard from './pages/Dashboard';
import Referrals from './pages/Referrals';
import Staffing from './pages/Staffing';
import Compliance from './pages/Compliance';
import FieldAssistant from './pages/FieldAssistant';
import Quality from './pages/Quality';
import ReferralPartners from './pages/ReferralPartners';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import './index.css';

function AppContent() {
  const { state, getComplianceStatus } = useAppState();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notifications = useMemo(() => {
    const items: { text: string; type: string }[] = [];
    
    state.referrals.filter(r => r.urgency === 'Immediate').forEach(r => {
      items.push({ text: `Urgent referral: ${r.patientInitials} (${r.serviceType})`, type: 'urgent' });
    });
    
    state.compliance.filter(c => getComplianceStatus(c) === 'Expired').forEach(c => {
      items.push({ text: `Expired: ${c.staffName} - ${c.itemType}`, type: 'urgent' });
    });
    
    state.quality.filter(q => q.status === 'Open' && q.priority === 'High').forEach(q => {
      items.push({ text: `Open QA: ${q.type} for ${q.patientInitials}`, type: 'warning' });
    });
    
    return items;
  }, [state, getComplianceStatus]);

  const rolePermissions = {
    'VP': ['/', '/referrals', '/staffing', '/compliance', '/field-assistant', '/quality', '/referral-partners', '/settings', '/audit-log'],
    'Intake Coordinator': ['/', '/referrals', '/referral-partners', '/settings', '/audit-log'],
    'Scheduler': ['/', '/staffing', '/referrals', '/field-assistant', '/settings'],
    'Field Staff': ['/field-assistant', '/quality', '/settings'],
    'Compliance Admin': ['/', '/compliance', '/audit-log', '/settings']
  };

  const canAccess = (path: string) => {
    const role = state.currentUser.role || 'VP';
    const allowedPaths = rolePermissions[role as keyof typeof rolePermissions];
    return allowedPaths?.includes(path) || false;
  };

  const ProtectedRoute = ({ element, path }: { element: React.ReactNode, path: string }) => {
    if (!canAccess(path)) {
      return <Navigate to="/" replace />;
    }
    return <>{element}</>;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-advisa-primary text-white p-6 hidden md:block">
          <div className="mb-8">
            <h1 className="text-xl font-bold">AdvisaCare VP</h1>
            <div className="mt-2 px-3 py-1 bg-advisa-accent/30 rounded-lg text-sm">
              <span className="font-medium">Role:</span> {state.currentUser.role}
            </div>
          </div>
          <nav className="space-y-2">
            {[
              { path: '/', label: 'Dashboard', icon: '📊' },
              { path: '/referrals', label: 'Referrals', icon: '📋' },
              { path: '/staffing', label: 'Staffing', icon: '👥' },
              { path: '/compliance', label: 'Compliance', icon: '✅' },
              { path: '/field-assistant', label: 'Field Assistant', icon: '📱' },
              { path: '/quality', label: 'Quality', icon: '⭐' },
              { path: '/referral-partners', label: 'Partners', icon: '🤝' },
              { path: '/settings', label: 'Settings', icon: '⚙️' },
              { path: '/audit-log', label: 'Audit Log', icon: '🔍' },
            ].filter((link) => canAccess(link.path)).map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${isActive ? 'bg-advisa-accent' : 'hover:bg-advisa-secondary'}`
                }
              >
                <span>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Prototype Banner */}
          <div className="bg-hipaa-red/10 border border-hipaa-red/30 text-hipaa-red text-sm px-4 py-2 rounded-lg mb-6">
            ⚠️ Prototype only — demo data — not for production use without HIPAA review, BAA, security controls, and company approval.
          </div>

          {/* Notification Bell */}
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-2xl">🔔</span>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-hipaa-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="card mb-6 max-w-md ml-auto">
              <h3 className="font-semibold mb-3">🔔 Notifications ({notifications.length})</h3>
              <ul className="space-y-2">
                {notifications.length === 0 ? (
                  <li className="text-sm text-gray-400">No new notifications</li>
                ) : (
                  notifications.map((n, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${n.type === 'urgent' ? 'bg-hipaa-red/10' : 'bg-yellow-50'}`}>
                      {n.text}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <Routes>
            <Route path="/" element={<ProtectedRoute path="/" element={<Dashboard />} />} />
            <Route path="/referrals" element={<ProtectedRoute path="/referrals" element={<Referrals />} />} />
            <Route path="/staffing" element={<ProtectedRoute path="/staffing" element={<Staffing />} />} />
            <Route path="/compliance" element={<ProtectedRoute path="/compliance" element={<Compliance />} />} />
            <Route path="/field-assistant" element={<ProtectedRoute path="/field-assistant" element={<FieldAssistant />} />} />
            <Route path="/quality" element={<ProtectedRoute path="/quality" element={<Quality />} />} />
            <Route path="/referral-partners" element={<ProtectedRoute path="/referral-partners" element={<ReferralPartners />} />} />
            <Route path="/settings" element={<ProtectedRoute path="/settings" element={<Settings />} />} />
            <Route path="/audit-log" element={<ProtectedRoute path="/audit-log" element={<AuditLog />} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
