import type { UserRole } from '../types';

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

export const allRoutes: RouteConfig[] = [
  { path: '/', label: 'Dashboard', icon: '📊', roles: ['VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'] },
  { path: '/referrals', label: 'Referrals', icon: '📋', roles: ['VP', 'Intake Coordinator', 'Scheduler'] },
  { path: '/staffing', label: 'Staffing', icon: '👥', roles: ['VP', 'Scheduler', 'Compliance Admin'] },
  { path: '/compliance', label: 'Compliance', icon: '✅', roles: ['VP', 'Compliance Admin'] },
  { path: '/field-assistant', label: 'Field Assistant', icon: '📱', roles: ['VP', 'Scheduler', 'Field Staff'] },
  { path: '/quality', label: 'Quality', icon: '⭐', roles: ['VP', 'Intake Coordinator'] },
  { path: '/referral-partners', label: 'Partners', icon: '🤝', roles: ['VP', 'Intake Coordinator'] },
  { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['VP'] },
  { path: '/audit-log', label: 'Audit Log', icon: '🔍', roles: ['VP', 'Compliance Admin'] },
];

export function canAccessRoute(path: string, role: UserRole): boolean {
  const route = allRoutes.find(r => r.path === path);
  if (!route) return false;
  return route.roles.includes(role);
}

export function getVisibleRoutes(role: UserRole): RouteConfig[] {
  return allRoutes.filter(r => r.roles.includes(role));
}
