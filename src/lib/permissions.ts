export type Role = 'ADMIN' | 'OPERATOR' | 'READONLY';

// Permisos por rol
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    'contracts.create',
    'contracts.read',
    'contracts.update',
    'contracts.delete',
    'contracts.rescind',
    'providers.create',
    'providers.read',
    'providers.update',
    'providers.delete',
    'documents.upload',
    'documents.read',
    'documents.delete',
    'reports.read',
    'reports.export',
    'audit.read',
    'templates.create',
    'templates.read',
    'templates.update',
    'templates.delete',
    'users.manage',
    'settings.manage',
  ],
  OPERATOR: [
    'contracts.create',
    'contracts.read',
    'contracts.update',
    'contracts.rescind',
    'providers.create',
    'providers.read',
    'providers.update',
    'documents.upload',
    'documents.read',
    'reports.read',
    'reports.export',
    'templates.read',
  ],
  READONLY: [
    'contracts.read',
    'providers.read',
    'documents.read',
    'reports.read',
    'templates.read',
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    ADMIN: 'Administrador',
    OPERATOR: 'Operador',
    READONLY: 'Solo Lectura',
  };
  return labels[role] || role;
}
