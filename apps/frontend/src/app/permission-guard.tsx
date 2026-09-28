import { Navigate, Outlet } from 'react-router-dom';
import type { Permission } from '@app/shared';
import { useAuth } from '@/stores/auth-context';

export function PermissionGuard({ permission }: { permission: Permission }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
