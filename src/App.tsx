import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppState } from './context/AppContext';
import { ToastProvider, useToast } from './components/Toast';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { allRoutes, canAccessRoute, getFirstAllowedRoute } from './lib/permissions';
import { activeAlertCount } from './lib/alertEngine';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, Settings, FileSearch, Bell, AlertTriangle,
  ChevronRight, Shield, Eye, Check, X, Menu, XCircle, HeartPulse, Lock,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Referrals from './pages/Referrals';
import Staffing from './pages/Staffing';
import Compliance from './pages/Compliance';
import FieldAssistant from './pages/FieldAssistant';
import Quality from './pages/Quality';
import CatastrophicCare from './pages/CatastrophicCare';
import ReferralPartners from './pages/ReferralPartners';
import SettingsPage from './pages/Settings';
import AuditLog from './pages/AuditLog';
import SecurityChecklist from './pages/SecurityChecklist';
import './index.css';

const routeComponents: Record<string, React.ComponentType> = {
  '/': Dashboard,
  '/referrals': Referrals,
  '/staffing': Staffing,
  '/compliance': Compliance,
  '/field-assistant': FieldAssistant,
  '/quality': Quality,
  '/catastrophic-care': CatastrophicCare,
  '/referral-partners': ReferralPartners,
  '/settings': SettingsPage,
  '/audit-log': AuditLog,
  '/security-checklist': SecurityChecklist,
};

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, Settings, FileSearch, HeartPulse, Lock,
};

/**
 * Map sourceRecordType → base route path.
 * View Source appends query params for exact record navigation.
 */
const sourceRouteMap: Record<string, string> = {
  Referral: '/referrals',
  Staff: '/staffing',
  Compliance: '/compliance',
  Visit: '/field-assistant',
  Quality: '/quality',
  Partner: '/referral-partners',
  Shift: '/staffing',
  Document: '/referrals',
  Alert: '/',
  System: '/',
};

/** Query param keys per source record type for View Source deep linking */
const sourceParamMap: Record<string, string> = {
  Referral: 'ref',
  Compliance: 'item',
  Visit: 'visit',
  Quality: 'qid',
  Partner: 'partner',
  Shift: 'shift',
  Document: 'doc',
};

/**
 * Fix #6 — given an alert, compute the View Source destination.
 *
 *  - Catastrophic-flagged shift alerts (metadata.caseId present, or type starts with
 *    "Catastrophic ") route to /catastrophic-care?case=CASE_ID. This includes the
 *    "Catastrophic Uncovered Shift" alert from the alert engine.
 *  - Plain shift alerts route to /staffing?shift=SHIFT_ID.
 *  - Everything else uses the source-record map above.
 *
 * Centralised so the notification center and any other consumer share the same logic.
 */
export function resolveAlertHref(alert: {
  type: string;
  sourceRecordType: string;
  sourceRecordId: string;
  metadata?: { caseId?: string };
}): string {
  if (alert.metadata?.caseId) {
    return `/catastrophic-care?case=${encodeURIComponent(alert.metadata.caseId)}`;
  }
  if (alert.type && alert.type.startsWith('Catastrophic ')) {
    // Catastrophic alert without metadata — fall back to the catastrophic page.
    return `/catastrophic-care`;
  }
  const basePath = sourceRouteMap[alert.sourceRecordType] || '/';
  const paramKey = sourceParamMap[alert.sourceRecordType];
  return paramKey
    ? `${basePath}?${paramKey}=${encodeURIComponent(alert.sourceRecordId)}`
    : basePath;
}

function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { state, acknowledgeAlert, resolveAlert, addAuditEntry } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const activeAlerts = useMemo(() =>
    state.alerts.filter(a => !a.resolved),
    [state.alerts]
  );

  const unacknowledgedCount = activeAlerts.filter(a => !a.acknowledged).length;

  const grouped = useMemo(() => {
    const groups: Record<string, typeof activeAlerts> = { Critical: [], High: [], Medium: [], Low: [] };
    activeAlerts.forEach(a => {
      if (groups[a.severity]) groups[a.severity].push(a);
    });
    return groups;
  }, [activeAlerts]);

  const handleAcknowledge = (id: string) => {
    acknowledgeAlert(id);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Alert', recordId: id,
      details: 'Alert acknowledged',
    });
    showToast('Alert acknowledged', 'info');
  };

  const handleResolve = (id: string) => {
    resolveAlert(id);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Alert', recordId: id,
      details: 'Alert resolved',
    });
    showToast('Alert resolved', 'success');
  };

  const handleViewSource = (alert: {
    type: string;
    sourceRecordType: string;
    sourceRecordId: string;
    metadata?: { caseId?: string };
  }) => {
    navigate(resolveAlertHref(alert));
    onClose();
  };

  const severityColors: Record<string, string> = {
    Critical: 'bg-red-50 border-red-200 text-red-800',
    High: 'bg-amber-50 border-amber-200 text-amber-800',
    Medium: 'bg-sky-50 border-sky-200 text-sky-800',
    Low: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  const severityDots: Record<string, string> = {
    Critical: 'bg-red-500', High: 'bg-amber-500', Medium: 'bg-sky-500', Low: 'bg-slate-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-advisa-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Notification Center</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{unacknowledgedCount} unacknowledged · {activeAlerts.length} active</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} className="text-slate-500" /></button>
        </div>

        <div className="p-4 space-y-4">
          {(Object.entries(grouped) as [string, typeof activeAlerts][]).map(([severity, alerts]) => {
            if (alerts.length === 0) return null;
            return (
              <div key={severity}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${severityDots[severity]}`} />
                  <span className="text-xs font-semibold text-slate-600">{severity} ({alerts.length})</span>
                </div>
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg border text-xs ${severityColors[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{alert.type}</p>
                          <p className="mt-0.5 opacity-80">{alert.message}</p>
                          <p className="mt-1 text-[10px] opacity-50">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => handleViewSource(alert)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 hover:bg-white rounded border border-current/10 text-[10px] font-medium"
                        >
                          <Eye size={10} />View Source
                        </button>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 hover:bg-white rounded border border-current/10 text-[10px] font-medium"
                          >
                            <Check size={10} />Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 hover:bg-white rounded border border-current/10 text-[10px] font-medium"
                        >
                          <XCircle size={10} />Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {activeAlerts.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No active alerts</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Redirect guard: if current path is not allowed for current role, redirect to first allowed route */
function RoleRedirect() {
  const { state } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canAccessRoute(location.pathname, state.currentUser.role)) {
      const target = getFirstAllowedRoute(state.currentUser.role);
      navigate(target, { replace: true });
    }
  }, [state.currentUser.role, location.pathname, navigate]);

  return null;
}

function AppContent() {
  const { state } = useAppState();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unacknowledgedCount = useMemo(() =>
    activeAlertCount(state.alerts),
    [state.alerts]
  );

  const canAccess = useCallback((path: string) => canAccessRoute(path, state.currentUser.role), [state.currentUser.role]);

  const ProtectedRoute = ({ element, path }: { element: React.ReactNode; path: string }) => {
    if (!canAccess(path)) {
      const target = getFirstAllowedRoute(state.currentUser.role);
      return <Navigate to={target} replace />;
    }
    return <>{element}</>;
  };

  const visibleRoutes = allRoutes.filter(r => canAccess(r.path));

  const sidebarContent = (
    <>
      {/* Logo */}
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
              onClick={() => setSidebarOpen(false)}
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <ShieldCheck size={12} />
          <span>Prototype — Demo Data Only</span>
        </div>
      </div>
    </>
  );

  return (
    <BrowserRouter>
      <RoleRedirect />
      <div className="min-h-screen bg-advisa-surface flex">
        {/* Desktop Sidebar */}
        <aside className="w-[260px] bg-gradient-to-b from-advisa-primary to-advisa-secondary text-white hidden md:flex md:flex-col shadow-sidebar flex-shrink-0">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="relative w-[260px] h-full bg-gradient-to-b from-advisa-primary to-advisa-secondary text-white flex flex-col shadow-sidebar" onClick={e => e.stopPropagation()}>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-advisa-border px-4 md:px-8 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg">
                <Menu size={20} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span className="font-medium hidden sm:inline">Prototype only — simulated data — not for production use</span>
                <span className="font-medium sm:hidden">Demo only</span>
              </div>
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Bell size={18} className="text-slate-500" />
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unacknowledgedCount}
                </span>
              )}
            </button>
          </header>

          {/* Notification Center */}
          {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}

          {/* Page Content */}
          <div className="p-4 md:p-8">
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
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
