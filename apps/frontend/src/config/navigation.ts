import {
  LayoutDashboard,
  Megaphone,
  Shield,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS, type Permission } from '@app/shared';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  permission?: Permission;
  children?: NavItem[];
};

export const navigation: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    id: 'campaigns',
    label: 'Campanhas',
    icon: Megaphone,
    to: '/campaigns',
    permission: PERMISSIONS.CAMPAIGNS_READ,
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Target,
    to: '/leads',
    permission: PERMISSIONS.LEADS_READ,
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: Users,
    to: '/users',
    permission: PERMISSIONS.USERS_READ,
  },
  {
    id: 'roles',
    label: 'Papéis',
    icon: Shield,
    to: '/roles',
    permission: PERMISSIONS.ROLES_READ,
  },
  {
    id: 'profile',
    label: 'Meu perfil',
    icon: UserRound,
    to: '/profile',
  },
];
