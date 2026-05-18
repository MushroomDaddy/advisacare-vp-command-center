import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAppState, AppProvider } from './context/AppContext';
import { canAccessRoute, getFirstAccessibleRoute, getVisibleRoutes } from './lib/permissions';
import type { AlertSeverity } from './types';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone, Star,
  Handshake, Settings as SettingsIcon, FileSearch, Lock, Bell, AlertTriangle,
  X, CheckCircle, Eye, Info, AlertOctagon, XCircle
} from 'lucide-react';
import type { UserRole } from './types';

// --- Lazy load pages ---
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Staffing = lazy(() => import('./pages/Staffing'));
const Compliance = lazy(() => import('./pages/Compliance'));
const FieldAssistant = lazy(() => import('./pages/FieldAssistant'));
const Quality = lazy(() => import('./pages/Quality'));
const ReferralPartners = lazy(() => import('./pages/ReferralPartners'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const SecurityChecklist = lazy(() => import('./pages/SecurityChecklist'));

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={17} />,
  ClipboardList: <ClipboardList size={17} />,
  Users: <Users size={17} />,
  ShieldCheck: <ShieldCheck size={17} />,
  Smartphone: <Smartphone size={17} />,
  Star: <Star size={17} />,
  Handshake: <Handshake size={17} />,
  Settings: <SettingsIcon size={17} />,
  FileSearch: <FileSearch size={17} />,
  Lock: <Lock size={17} />,
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="animate-spin h-8 w-8 border-3 border-advisa-accent border-t-transparent rounded-full" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-slate-400 text-sm">
      <p>{message}</p>
    </div>
  );
}

// --- Guard Route ---
function GuardedRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const { state } = useAppState();
  if (!canAccessRoute(path, state.currentUser.role)) {
    return <Navigate to={getFirstAccessibleRoute(state.currentUser.role)} replace />;
  }
  return <>{children}</>;
}

// --- HIPAA Banner ---
function HIPAABanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2" data-testid="hipaa-banner">
      <AlertTriangle size={13} className="flex-shrink-0" />
      <span>
        <strong>HIPAA-conscious prototype</strong> — Prototype only — demo data — not for production use.
        A BAA, encryption at rest, MFA, server-side RBAC, immutable audit logging, automatic logoff, secure backups,
        disaster recovery, and a full HIPAA/security review with security controls are required before handling real PHI.
      </span>
    </div>
  );
}

// --- Toast System ---
function ToastContainer() {
  const { state, removeToast } = useAppState();
  if (state.toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle size={14} className="text-emerald-600" />,
    error: <XCircle size={14} className="text-red-600" />,
    warning: <AlertTriangle size={14} className="text-amber-600" />,
    info: <Info size={14} className="text-sky-600" />,
  };
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2" data-testid="toast-container">
      {state.toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm animate-slide-in ${colors[toast.type]}`}>
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// --- Notification Center Drawer ---
const severityOrder: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
const severityStyles: Record<AlertSeverity, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', label: 'Critical', icon: <AlertOctagon size={13} className="text-red-600" /> },
  high: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', label: 'High', icon: <AlertTriangle size={13} className="text-orange-600" /> },
  medium: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Medium', icon: <Info size={13} className="text-amber-600" /> },
  low: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', label: 'Low', icon: <Info size={13} className="text-sky-600" /> },
};

function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, acknowledgeAlert, addAuditEntry, addToast } = useAppState();
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');

  if (!open) return null;

  const alerts = state.alerts
    .filter(a => filterSeverity === 'all' || a.severity === filterSeverity)
    .sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    });

  const grouped = severityOrder.reduce<Record<string, typeof alerts>>((acc, sev) => {
    const items = alerts.filter(a => a.severity === sev);
    if (items.length > 0) acc[sev] = items;
    return acc;
  }, {});

  const unackCount = state.alerts.filter(a => !a.acknowledged).length;

  const handleAcknowledge = (alertId: string) => {
    const alert = state.alerts.find(a => a.id === alertId);
    acknowledgeAlert(alertId);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Alert',
      recordId: alertId,
      details: `Acknowledged alert: ${alert?.title || alertId}`,
    });
    addToast('Alert acknowledged', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="notification-center">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[420px] bg-white shadow-2xl overflow-y-auto border-l border-advisa-border">
        <div className="sticky top-0 bg-white border-b border-advisa-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bell size={18} className="text-advisa-accent" />
              Notifications
            </p>
            <p className="text-xs text-slate-400">{unackCount} unacknowledged</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="select text-xs py-1" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as AlertSeverity | 'all')}>
              <option value="all">All Severities</option>
              {severityOrder.map(s => <option key={s} value={s}>{severityStyles[s].label}</option>)}
            </select>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {Object.entries(grouped).length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No notifications</p>
          )}
          {Object.entries(grouped).map(([severity, items]) => {
            const style = severityStyles[severity as AlertSeverity];
            return (
              <div key={severity}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${style.text}`}>
                  {style.icon} {style.label} ({items.filter(a => !a.acknowledged).length} active)
                </p>
                <div className="space-y-2">
                  {items.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${alert.acknowledged ? 'bg-slate-50 border-slate-200 opacity-60' : style.bg}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-semibold ${alert.acknowledged ? 'text-slate-500' : style.text}`}>
                          {alert.title}
                        </p>
                        {alert.acknowledged && <span className="badge badge-success text-[9px]">Ack</span>}
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{alert.details}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          <p>{new Date(alert.timestamp).toLocaleString()}</p>
                          {alert.owner && <p>Owner: {alert.owner}</p>}
                          {alert.sourceRecordType && <p>Source: {alert.sourceRecordType} #{alert.sourceRecordId}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!alert.acknowledged && (
                            <button onClick={() => handleAcknowledge(alert.id!)} className="btn-primary text-[10px] py-1 px-2">
                              <CheckCircle size={10} /> Ack
                            </button>
                          )}
                          {alert.sourceRecordId && (
                            <button className="btn-secondary text-[10px] py-1 px-2" title="View source record">
                              <Eye size={10} /> View
                            </button>
                          )}
                        </div>
                      </div>
                      {alert.acknowledged && alert.acknowledgedBy && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Acknowledged by {alert.acknowledgedBy} at {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleString() : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Alert Badge ---
function AlertBadge() {
  const { state } = useAppState();
  const unacknowledged = state.alerts.filter(a => !a.acknowledged).length;
  if (unacknowledged === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold" data-testid="alert-badge">
      {unacknowledged > 9 ? '9+' : unacknowledged}
    </span>
  );
}

// --- Sidebar ---
function Sidebar({ onBellClick }: { onBellClick: () => void }) {
  const { state } = useAppState();
  const routes = getVisibleRoutes(state.currentUser.role);

  return (
    <aside className="w-56 bg-white border-r border-advisa-border flex flex-col h-full" aria-label="Main navigation">
      <div className="p-4 border-b border-advisa-border">
        <h1 className="text-base font-bold text-advisa-primary tracking-tight">AdvisaCare</h1>
        <p className="text-[10px] text-slate-400 mt-0.5">VP Command Center</p>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {routes.map(route => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all ${isActive
                ? 'text-advisa-accent bg-sky-50 border-r-2 border-advisa-accent'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`
            }
          >
            {iconMap[route.icon]}
            {route.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-advisa-border bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-advisa-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
            {state.currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{state.currentUser.name}</p>
            <p className="text-[10px] text-slate-400">{state.currentUser.role}</p>
          </div>
          <button
            onClick={onBellClick}
            className="relative p-1 hover:bg-slate-200 rounded transition-colors"
            aria-label="Open notifications"
            data-testid="notification-bell"
          >
            <Bell size={14} className="text-slate-400" />
            <AlertBadge />
          </button>
        </div>
      </div>
    </aside>
  );
}

// --- Last Refreshed ---
function LastRefreshed() {
  const { state, refreshTimestamp } = useAppState();
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-400">
      <span>Last refreshed: {new Date(state.lastRefreshed).toLocaleTimeString()}</span>
      <button onClick={refreshTimestamp} className="hover:text-advisa-accent transition-colors underline">
        Refresh
      </button>
    </div>
  );
}

// --- Page header ---
function PageHeader() {
  const location = useLocation();
  const { state } = useAppState();
  const routes = getVisibleRoutes(state.currentUser.role);
  const current = routes.find(r => r.path === location.pathname);
  return (
    <header className="bg-white border-b border-advisa-border px-6 py-3 flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-700">{current?.label || 'AdvisaCare'}</p>
      <LastRefreshed />
    </header>
  );
}

// --- Main App Shell ---
function AppShell() {
  const { state } = useAppState();
  const [notifOpen, setNotifOpen] = useState(false);
  const firstRoute = getFirstAccessibleRoute(state.currentUser.role);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen">
        <HIPAABanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onBellClick={() => setNotifOpen(true)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <PageHeader />
            <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<GuardedRoute path="/"><Dashboard /></GuardedRoute>} />
                  <Route path="/referrals" element={<GuardedRoute path="/referrals"><Referrals /></GuardedRoute>} />
                  <Route path="/staffing" element={<GuardedRoute path="/staffing"><Staffing /></GuardedRoute>} />
                  <Route path="/compliance" element={<GuardedRoute path="/compliance"><Compliance /></GuardedRoute>} />
                  <Route path="/field-assistant" element={<GuardedRoute path="/field-assistant"><FieldAssistant /></GuardedRoute>} />
                  <Route path="/quality" element={<GuardedRoute path="/quality"><Quality /></GuardedRoute>} />
                  <Route path="/referral-partners" element={<GuardedRoute path="/referral-partners"><ReferralPartners /></GuardedRoute>} />
                  <Route path="/settings" element={<GuardedRoute path="/settings"><SettingsPage /></GuardedRoute>} />
                  <Route path="/audit-log" element={<GuardedRoute path="/audit-log"><AuditLog /></GuardedRoute>} />
                  <Route path="/security-checklist" element={<GuardedRoute path="/security-checklist"><SecurityChecklist /></GuardedRoute>} />
                  <Route path="*" element={<Navigate to={firstRoute} replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
        <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export { EmptyState, LoadingSpinner };
export type { UserRole };
