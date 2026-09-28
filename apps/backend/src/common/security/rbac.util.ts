import { Permission, SYSTEM_ADMIN_ROLE_NAME } from '@app/shared';
import { AuthContext } from '../types/auth-context';

export function hasAllPermissions(actor: Permission[], required: Permission[]): boolean {
  const set = new Set(actor);
  return required.every((permission) => set.has(permission));
}

export function canAssignPermissions(actor: Permission[], target: Permission[]): boolean {
  return hasAllPermissions(actor, target);
}

export function actorIsSystemAdmin(actor: AuthContext): boolean {
  return actor.roles.some(
    (role) => role.isSystem && role.name === SYSTEM_ADMIN_ROLE_NAME,
  );
}

export function uniquePermissions(values: Permission[]): Permission[] {
  return [...new Set(values)];
}
