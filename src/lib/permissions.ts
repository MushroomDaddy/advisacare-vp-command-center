import type { UserRole } from '../types';

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;  // Lucide icon name
  roles: UserRole[];
}

/**
 * Single source of truth for all route configurations and role-based access.
 * Used by App.tsx (navigation/routing), Settings.tsx (permission display),
 * and any other component needing role-based access checks.
 */
export const allRoutes: RouteConfig[] = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['VP', 'Intake Coordinator', 'Scheduler', 'Compliance Admin'] },
  { path: '/referrals', label: 'Referrals', icon: 'ClipboardList', roles: ['VP', 'Intake Coordinator', 'Scheduler'] },
  { path: '/staffing', label: 'Staffing', icon: 'Users', roles: ['VP', 'Scheduler'] },
  { path: '/compliance', label: 'Compliance', icon: 'ShieldCheck', roles: ['VP', 'Compliance Admin'] },
  { path: '/field-assistant', label: 'Field Assistant', icon: 'Smartphone', roles: ['VP', 'Scheduler', 'Field Staff'] },
  { path: '/quality', label: 'Quality', icon: 'Star', roles: ['VP', 'Field Staff'] },
  { path: '/catastrophic-care', label: 'Catastrophic Care', icon: 'HeartPulse', roles: ['VP', 'Scheduler'] },
  { path: '/referral-partners', label: 'Partners', icon: 'Handshake', roles: ['VP', 'Intake Coordinator'] },
  { path: '/settings', label: 'Settings', icon: 'Settings', roles: ['VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'] },
  { path: '/audit-log', label: 'Audit Log', icon: 'FileSearch', roles: ['VP', 'Compliance Admin', 'Intake Coordinator'] },
];

export function canAccessRoute(path: string, role: UserRole): boolean {
  const route = allRoutes.find(r => r.path === path);
  if (!route) return false;
  return route.roles.includes(role);
}

export function getVisibleRoutes(role: UserRole): RouteConfig[] {
  return allRoutes.filter(r => r.roles.includes(role));
}

/**
 * Returns the first allowed route for a role.
 * Used when a user is on an unauthorized route after role switch.
 */
export function getFirstAllowedRoute(role: UserRole): string {
  const visible = getVisibleRoutes(role);
  return visible.length > 0 ? visible[0].path : '/settings';
}

export function getPermissionsForRole(role: UserRole): string[] {
  return allRoutes.filter(r => r.roles.includes(role)).map(r => r.label);
}
