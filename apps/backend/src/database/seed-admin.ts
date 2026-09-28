import { ALL_PERMISSIONS, Permission, SYSTEM_ADMIN_ROLE_NAME } from '@app/shared';
import { PrismaClient } from '../generated/prisma/client';

export async function ensureAdminSeed(
  prisma: PrismaClient,
  input: { login: string; passwordHash: string },
): Promise<{ createdRole: boolean; createdUser: boolean }> {
  const login = input.login.toLowerCase();
  let createdRole = false;
  let createdUser = false;

  let adminRole = await prisma.role.findFirst({
    where: { name: SYSTEM_ADMIN_ROLE_NAME, deletedAt: null },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: SYSTEM_ADMIN_ROLE_NAME,
        description: 'Acesso total ao sistema',
        permissions: [...ALL_PERMISSIONS],
        isSystem: true,
      },
    });
    createdRole = true;
  } else if (adminRole.permissions.length !== ALL_PERMISSIONS.length) {
    await prisma.role.update({
      where: { id: adminRole.id },
      data: { permissions: [...ALL_PERMISSIONS] },
    });
  }

  const existing = await prisma.user.findUnique({ where: { login } });
  if (!existing) {
    await prisma.user.create({
      data: {
        login,
        passwordHash: input.passwordHash,
        status: 'active',
        roles: { create: [{ roleId: adminRole.id }] },
      },
    });
    createdUser = true;
  }

  return { createdRole, createdUser };
}

export function asPermissions(values: string[]): Permission[] {
  return values as Permission[];
}
