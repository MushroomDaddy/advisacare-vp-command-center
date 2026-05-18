import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar */}
          <aside className="w-64 bg-advisa-primary text-white p-6 hidden md:block">
            <h1 className="text-xl font-bold mb-8">AdvisaCare VP</h1>
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
              ].map((link) => (
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

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/staffing" element={<Staffing />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/field-assistant" element={<FieldAssistant />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/referral-partners" element={<ReferralPartners />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit-log" element={<AuditLog />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
