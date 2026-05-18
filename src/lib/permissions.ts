import type { UserRole, CRUDAction, PermissionEntry } from '../types';

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

/**
 * Single source of truth for all route configurations and role-based access.
 */
export const allRoutes: RouteConfig[] = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['VP', 'Intake Coordinator', 'Scheduler', 'Compliance Admin'] },
  { path: '/referrals', label: 'Referrals', icon: 'ClipboardList', roles: ['VP', 'Intake Coordinator', 'Scheduler'] },
  { path: '/staffing', label: 'Staffing', icon: 'Users', roles: ['VP', 'Scheduler'] },
  { path: '/compliance', label: 'Compliance', icon: 'ShieldCheck', roles: ['VP', 'Compliance Admin'] },
  { path: '/field-assistant', label: 'Field Assistant', icon: 'Smartphone', roles: ['VP', 'Scheduler', 'Field Staff'] },
  { path: '/quality', label: 'Quality', icon: 'Star', roles: ['VP', 'Field Staff'] },
  { path: '/referral-partners', label: 'Partners', icon: 'Handshake', roles: ['VP', 'Intake Coordinator'] },
  { path: '/settings', label: 'Settings', icon: 'Settings', roles: ['VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'] },
  { path: '/audit-log', label: 'Audit Log', icon: 'FileSearch', roles: ['VP', 'Compliance Admin', 'Intake Coordinator'] },
  { path: '/security-checklist', label: 'Security', icon: 'Lock', roles: ['VP', 'Compliance Admin'] },
];

export function canAccessRoute(path: string, role: UserRole): boolean {
  const route = allRoutes.find(r => r.path === path);
  if (!route) return false;
  return route.roles.includes(role);
}

export function getFirstAccessibleRoute(role: UserRole): string {
  const route = allRoutes.find(r => r.roles.includes(role));
  return route ? route.path : '/settings';
}

export function getVisibleRoutes(role: UserRole): RouteConfig[] {
  return allRoutes.filter(r => r.roles.includes(role));
}

export function getPermissionsForRole(role: UserRole): string[] {
  return allRoutes.filter(r => r.roles.includes(role)).map(r => r.label);
}

// ==================== CRUD Permission Grid ====================

const permissionGrid: Record<UserRole, PermissionEntry[]> = {
  VP: [
    { resource: 'Referrals', actions: ['view', 'edit', 'create', 'delete', 'export'] },
    { resource: 'Staffing', actions: ['view', 'edit', 'create', 'delete', 'export'] },
    { resource: 'Compliance', actions: ['view', 'edit', 'create', 'delete', 'export'] },
    { resource: 'Field Visits', actions: ['view', 'edit', 'export'] },
    { resource: 'Quality', actions: ['view', 'edit', 'create', 'delete', 'export'] },
    { resource: 'Partners', actions: ['view', 'edit', 'create', 'delete', 'export'] },
    { resource: 'Audit Log', actions: ['view', 'export'] },
    { resource: 'Settings', actions: ['view', 'edit'] },
  ],
  'Intake Coordinator': [
    { resource: 'Referrals', actions: ['view', 'edit', 'create', 'export'] },
    { resource: 'Partners', actions: ['view', 'edit', 'create'] },
    { resource: 'Audit Log', actions: ['view'] },
    { resource: 'Settings', actions: ['view'] },
  ],
  Scheduler: [
    { resource: 'Referrals', actions: ['view'] },
    { resource: 'Staffing', actions: ['view', 'edit', 'export'] },
    { resource: 'Field Visits', actions: ['view', 'edit', 'create'] },
    { resource: 'Settings', actions: ['view'] },
  ],
  'Field Staff': [
    { resource: 'Field Visits', actions: ['view', 'edit'] },
    { resource: 'Quality', actions: ['view', 'create'] },
    { resource: 'Settings', actions: ['view'] },
  ],
  'Compliance Admin': [
    { resource: 'Compliance', actions: ['view', 'edit', 'create', 'export'] },
    { resource: 'Audit Log', actions: ['view', 'export'] },
    { resource: 'Settings', actions: ['view'] },
  ],
};

export function getCRUDPermissions(role: UserRole): PermissionEntry[] {
  return permissionGrid[role] || [];
}

export function hasPermission(role: UserRole, resource: string, action: CRUDAction): boolean {
  const entries = permissionGrid[role] || [];
  const entry = entries.find(e => e.resource === resource);
  return entry ? entry.actions.includes(action) : false;
}

export const allResources = ['Referrals', 'Staffing', 'Compliance', 'Field Visits', 'Quality', 'Partners', 'Audit Log', 'Settings'];
export const allCRUDActions: CRUDAction[] = ['view', 'edit', 'create', 'delete', 'export'];
export const allRoles: UserRole[] = ['VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'];
