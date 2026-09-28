import { canAssignPermissions, hasAllPermissions } from './rbac.util';
import { PERMISSIONS } from '@app/shared';

describe('rbac.util', () => {
  it('requires every permission', () => {
    expect(
      hasAllPermissions(
        [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE],
        [PERMISSIONS.USERS_READ],
      ),
    ).toBe(true);
    expect(hasAllPermissions([PERMISSIONS.USERS_READ], [PERMISSIONS.USERS_DELETE])).toBe(false);
  });

  it('blocks privilege escalation through role assignment', () => {
    expect(
      canAssignPermissions(
        [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE],
        [PERMISSIONS.USERS_READ],
      ),
    ).toBe(true);
    expect(
      canAssignPermissions([PERMISSIONS.USERS_READ], [PERMISSIONS.USERS_READ, PERMISSIONS.ROLES_DELETE]),
    ).toBe(false);
  });
});
