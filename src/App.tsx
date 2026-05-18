import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AppProvider, useAppState } from './context/AppContext';
import { useState, useMemo } from 'react';
import { allRoutes, canAccessRoute } from './lib/permissions';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, Settings, FileSearch, Bell, AlertTriangle,
  ChevronRight, Shield,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Referrals from './pages/Referrals';
import Staffing from './pages/Staffing';
import Compliance from './pages/Compliance';
import FieldAssistant from './pages/FieldAssistant';
import Quality from './pages/Quality';
import ReferralPartners from './pages/ReferralPartners';
import SettingsPage from './pages/Settings';
import AuditLog from './pages/AuditLog';
import './index.css';

const routeComponents: Record<string, React.ComponentType> = {
  '/': Dashboard,
  '/referrals': Referrals,
  '/staffing': Staffing,
  '/compliance': Compliance,
  '/field-assistant': FieldAssistant,
  '/quality': Quality,
  '/referral-partners': ReferralPartners,
  '/settings': SettingsPage,
  '/audit-log': AuditLog,
};

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, Settings, FileSearch,
};

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

  const canAccess = (path: string) => canAccessRoute(path, state.currentUser.role);

  const ProtectedRoute = ({ element, path }: { element: React.ReactNode, path: string }) => {
    if (!canAccess(path)) {
      return <Navigate to="/" replace />;
    }
    return <>{element}</>;
  };

  const visibleRoutes = allRoutes.filter(r => canAccess(r.path));

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-advisa-surface flex">
        {/* Professional Sidebar */}
        <aside className="w-[260px] bg-gradient-to-b from-advisa-primary to-advisa-secondary text-white hidden md:flex md:flex-col shadow-sidebar">
          {/* Logo / Brand */}
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-advisa-accent rounded-lg flex items-center justify-center shadow-md">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight leading-tight">AdvisaCare</h1>
                <p className="text-[10px] font-medium text-sky-300 uppercase tracking-widest">VP Command Center</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-semibold">
                {state.currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{state.currentUser.name}</p>
                <p className="text-[11px] text-sky-300 font-medium">{state.currentUser.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="px-3 pb-2 text-[10px] font-semibold text-sky-300/60 uppercase tracking-widest">Navigation</p>
            {visibleRoutes.map((link) => {
              const Icon = iconMap[link.icon];
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-advisa-accent text-white shadow-md shadow-advisa-accent/25'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  {Icon && <Icon size={17} className="flex-shrink-0" />}
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                </NavLink>
              );
            })}
          </nav>

          {/* HIPAA Footer */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck size={12} />
              <span>HIPAA-Conscious Prototype</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-advisa-border px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <AlertTriangle size={14} />
              <span className="font-medium">Prototype — demo data only — not for production use</span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell size={18} className="text-slate-500" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </header>

          {/* Notification Panel */}
          {showNotifications && notifications.length > 0 && (
            <div className="mx-8 mt-4">
              <div className="card max-w-md ml-auto">
                <div className="card-header">
                  <Bell size={15} />
                  <span>Alerts ({notifications.length})</span>
                </div>
                <ul className="space-y-2">
                  {notifications.map((n, i) => (
                    <li key={i} className={`text-xs p-2.5 rounded-lg flex items-start gap-2 ${n.type === 'urgent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                      {n.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="p-8">
            <Routes>
              {allRoutes.map((route) => {
                const Component = routeComponents[route.path];
                if (!Component) return null;
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<ProtectedRoute path={route.path} element={<Component />} />}
                  />
                );
              })}
            </Routes>
          </div>
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
