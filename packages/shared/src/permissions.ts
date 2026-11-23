export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  CAMPAIGNS_READ: 'campaigns.read',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_UPDATE: 'campaigns.update',
  CAMPAIGNS_DELETE: 'campaigns.delete',
  LEADS_READ: 'leads.read',
  LEADS_UPDATE: 'leads.update',
  COMPANIES_READ: 'companies.read',
  PAIN_POINTS_READ: 'pain-points.read',
  PAIN_POINTS_CREATE: 'pain-points.create',
  PAIN_POINTS_UPDATE: 'pain-points.update',
  PAIN_POINTS_DELETE: 'pain-points.delete',
  OUTREACH_READ: 'outreach.read',
  OUTREACH_CREATE: 'outreach.create',
  OUTREACH_UPDATE: 'outreach.update',
  OUTREACH_DELETE: 'outreach.delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS: { resource: string; actions: Permission[] }[] = [
  {
    resource: 'users',
    actions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
    ],
  },
  {
    resource: 'roles',
    actions: [
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.ROLES_CREATE,
      PERMISSIONS.ROLES_UPDATE,
      PERMISSIONS.ROLES_DELETE,
    ],
  },
  {
    resource: 'campaigns',
    actions: [
      PERMISSIONS.CAMPAIGNS_READ,
      PERMISSIONS.CAMPAIGNS_CREATE,
      PERMISSIONS.CAMPAIGNS_UPDATE,
      PERMISSIONS.CAMPAIGNS_DELETE,
    ],
  },
  {
    resource: 'leads',
    actions: [PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_UPDATE],
  },
  {
    resource: 'companies',
    actions: [PERMISSIONS.COMPANIES_READ],
  },
  {
    resource: 'pain-points',
    actions: [
      PERMISSIONS.PAIN_POINTS_READ,
      PERMISSIONS.PAIN_POINTS_CREATE,
      PERMISSIONS.PAIN_POINTS_UPDATE,
      PERMISSIONS.PAIN_POINTS_DELETE,
    ],
  },
  {
    resource: 'outreach',
    actions: [
      PERMISSIONS.OUTREACH_READ,
      PERMISSIONS.OUTREACH_CREATE,
      PERMISSIONS.OUTREACH_UPDATE,
      PERMISSIONS.OUTREACH_DELETE,
    ],
  },
];

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as string[]).includes(value);
}

export function assertPermissions(values: string[]): Permission[] {
  const invalid = values.filter((value) => !isPermission(value));
  if (invalid.length > 0) {
    throw new Error(`Unknown permissions: ${invalid.join(', ')}`);
  }
  return values as Permission[];
}
