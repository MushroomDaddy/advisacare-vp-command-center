import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppState } from './context/AppContext';
import { ToastProvider, useToast } from './components/Toast';
import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { allRoutes, canAccessRoute, getFirstAllowedRoute } from './lib/permissions';
import { activeAlertCount } from './lib/alertEngine';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, Settings, FileSearch, Bell, AlertTriangle,
  ChevronRight, Shield, Eye, Check, X, Menu, XCircle, HeartPulse, Lock,
} from 'lucide-react';
// Route-level code splitting: each page becomes its own chunk so the
// initial bundle is smaller and the first paint is faster. Dashboard is
// the landing page so it's loaded eagerly; the rest are lazy.
import Dashboard from './pages/Dashboard';
const Referrals          = lazy(() => import('./pages/Referrals'));
const Staffing           = lazy(() => import('./pages/Staffing'));
const Compliance         = lazy(() => import('./pages/Compliance'));
const FieldAssistant     = lazy(() => import('./pages/FieldAssistant'));
const Quality            = lazy(() => import('./pages/Quality'));
const CatastrophicCare   = lazy(() => import('./pages/CatastrophicCare'));
const ReferralPartners   = lazy(() => import('./pages/ReferralPartners'));
const SettingsPage       = lazy(() => import('./pages/Settings'));
const AuditLog           = lazy(() => import('./pages/AuditLog'));
const SecurityChecklist  = lazy(() => import('./pages/SecurityChecklist'));
import { resolveAlertHref } from './lib/navigationUtils';
import './index.css';

/** Skeleton shown while a route chunk is loading. Calm, brand-correct,
 *  short (chunks are usually <100ms). Pulse uses the lime keyframe so
 *  it picks up the rest of the app's live language. */
function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full mx-auto mb-3 animate-pulse-lime"
          style={{ background: 'linear-gradient(135deg, #9BB83F, #7FA02D)' }}
          aria-hidden
        />
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-clinical-muted">Loading view…</p>
      </div>
    </div>
  );
}

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

  // Escape-to-close: a11y baseline. Modal/drawer overlays should dismiss
  // on Esc so keyboard-only users have a way out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
            <h3 className="text-sm font-bold text-slate-800">Operations Alerts</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{unacknowledgedCount} unacknowledged · {activeAlerts.length} active</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-advisa-primary"
            aria-label="Close operations alerts"
          >
            <X size={16} className="text-slate-500" aria-hidden />
          </button>
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
                          <Eye size={10} />View Related Item
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

  const userInitials = state.currentUser.name.split(' ').map(n => n[0]).join('');

  const sidebarContent = (
    <>
      {/* Brand block — lime monogram + Care Operations CC subtitle */}
      <div className="relative px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ACCB4D 0%, #9BB83F 45%, #7FA02D 100%)',
              boxShadow: '0 6px 14px -2px rgba(155,184,63,.45), inset 0 1px 0 rgba(255,255,255,.30), inset 0 -1px 0 rgba(0,0,0,.10)',
            }}
          >
            <Shield size={20} className="text-white relative z-10" />
            {/* Glass highlight */}
            <span
              aria-hidden
              className="absolute top-0.5 left-1 right-1 h-2/5 rounded-[6px]"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.28), transparent)' }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">AdvisaCare</h1>
            <p className="text-[10px] font-semibold text-advisa-lime uppercase tracking-[0.18em] mt-0.5">Care Operations CC</p>
          </div>
        </div>
        {/* Lime accent rule under the brand block */}
        <span
          aria-hidden
          className="absolute left-6 -bottom-px inline-block w-7 h-0.5 rounded-full"
          style={{ background: '#9BB83F', boxShadow: '0 0 8px rgba(155,184,63,.5)' }}
        />
      </div>

      {/* User Info — gradient avatar with live pulse ring */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="gravatar gravatar-teal" style={{ width: 34, height: 34, fontSize: 11 }}>
              {userInitials}
            </div>
            {/* Live online pulse */}
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{
                background: '#9BB83F',
                boxShadow: '0 0 0 2px #04363B',
                animation: 'advisa-pulse 2.2s ease-in-out infinite',
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{state.currentUser.name}</p>
            <p className="text-[11px] text-advisa-lime font-medium">{state.currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation — active item gets gradient slice + lime rail + live-pulse dot */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto relative">
        <p className="px-3 pb-2 text-[10px] font-semibold text-advisa-lime/70 uppercase tracking-widest">Navigation</p>
        {visibleRoutes.map((link) => {
          const Icon = iconMap[link.icon];
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 group border-l-[3px]',
                  isActive
                    ? 'text-white border-l-[#9BB83F]'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white border-l-transparent',
                ].join(' ')
              }
              style={undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-md pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, rgba(155,184,63,.14) 0%, rgba(255,255,255,.06) 60%)',
                        boxShadow: 'inset 1px 0 0 rgba(155,184,63,.30)',
                      }}
                    />
                  )}
                  {Icon && <Icon size={17} className="flex-shrink-0 relative z-10" />}
                  <span className="flex-1 relative z-10">{link.label}</span>
                  {isActive ? (
                    <span
                      aria-hidden
                      className="relative z-10 w-1.5 h-1.5 rounded-full"
                      style={{
                        background: '#9BB83F',
                        boxShadow: '0 0 6px rgba(155,184,63,.6)',
                        animation: 'advisa-pulse 2s ease-in-out infinite',
                      }}
                    />
                  ) : (
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity relative z-10" />
                  )}
                </>
              )}
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

  const sidebarBg: React.CSSProperties = {
    background:
      'radial-gradient(ellipse 280px 200px at 20% -10%, rgba(155,184,63,.10), transparent 70%),' +
      'radial-gradient(ellipse 240px 180px at 80% 100%, rgba(21,151,200,.08), transparent 70%),' +
      'linear-gradient(180deg, #06494F 0%, #04363B 60%, #032A2D 100%)',
  };

  return (
    <BrowserRouter>
      <RoleRedirect />
      <div className="min-h-screen bg-advisa-surface flex">
        {/* Desktop Sidebar — aurora gradient + grain texture */}
        <aside
          className="w-[260px] text-white hidden md:flex md:flex-col shadow-sidebar flex-shrink-0 relative overflow-hidden"
          style={sidebarBg}
        >
          <span aria-hidden className="grain-overlay" />
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside
              className="relative w-[260px] h-full text-white flex flex-col shadow-sidebar overflow-hidden"
              style={sidebarBg}
              onClick={e => e.stopPropagation()}
            >
              <span aria-hidden className="grain-overlay" />
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Glass command bar — live pulse + reconciled at + alert count */}
          <header
            className="sticky top-0 z-10 border-b border-advisa-border px-4 md:px-7 py-3 flex items-center justify-between gap-3"
            style={{
              background: 'rgba(245, 248, 247, 0.78)',
              backdropFilter: 'blur(14px) saturate(140%)',
              WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 hover:bg-white rounded-lg transition-colors"
                aria-label="Open navigation"
              >
                <Menu size={20} className="text-clinical-text" />
              </button>
              <div className="hidden md:flex items-center gap-2 text-[11px] text-clinical-muted font-medium">
                <span className="live-dot live-dot-sm" />
                <strong className="text-clinical-text font-semibold">Live</strong>
                <span>· updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {unacknowledgedCount > 0 && (
                <>
                  <span className="hidden md:inline-block w-px h-4 bg-advisa-border" aria-hidden />
                  <div className="hidden md:flex items-center gap-1 text-[11px] text-clinical-muted">
                    <strong className="font-semibold text-red-600">{unacknowledgedCount}</strong>
                    <span>active alerts</span>
                  </div>
                </>
              )}
              <span className="hidden md:inline-block w-px h-4 bg-advisa-border" aria-hidden />
              <div
                className="flex items-center gap-2 text-xs rounded-md px-2.5 py-1 border"
                style={{ background: 'linear-gradient(180deg,#FEF8DD,#FEF3C7)', borderColor: '#FCD34D', color: '#92400E' }}
                role="status"
              >
                <AlertTriangle size={12} className="flex-shrink-0" />
                <span className="font-medium hidden sm:inline">Prototype · simulated data</span>
                <span className="font-medium sm:hidden">Demo only</span>
              </div>
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white rounded-lg transition-all flex-shrink-0"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-clinical-text" />
              {unacknowledgedCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                  style={{ background: '#DC2626', boxShadow: '0 0 0 2px rgba(245,248,247,.78)' }}
                >
                  {unacknowledgedCount}
                </span>
              )}
            </button>
          </header>

          {/* Notification Center */}
          {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}

          {/* Page Content — lazy routes get a Suspense fallback */}
          <div className="p-4 md:p-8">
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
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
