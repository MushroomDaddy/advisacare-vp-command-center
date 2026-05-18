import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAppState, AppProvider } from './context/AppContext';
import { canAccessRoute, getFirstAccessibleRoute, getVisibleRoutes } from './lib/permissions';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone, Star,
  Handshake, Settings as SettingsIcon, FileSearch, Lock, Bell, AlertTriangle
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

// --- Alert Badge ---
function AlertBadge() {
  const { state } = useAppState();
  const unacknowledged = state.alerts.filter(a => !a.acknowledged).length;
  if (unacknowledged === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
      {unacknowledged}
    </span>
  );
}

// --- Sidebar ---
function Sidebar() {
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
          <div className="relative">
            <Bell size={14} className="text-slate-400" />
            <AlertBadge />
          </div>
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
  const firstRoute = getFirstAccessibleRoute(state.currentUser.role);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen">
        <HIPAABanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
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
