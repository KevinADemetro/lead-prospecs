import { Permission } from '@app/shared';

export type RoleSummary = {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
};

export type AuthContext = {
  id: string;
  login: string;
  status: 'active' | 'inactive';
  roleIds: string[];
  roles: RoleSummary[];
  permissions: Permission[];
};
