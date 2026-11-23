import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { PERMISSIONS } from '@app/shared';
import { AuthProvider } from '@/stores/auth-context';
import { ThemeProvider } from '@/stores/theme-context';
import { AuthGuard } from './auth-guard';
import { PermissionGuard } from './permission-guard';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/features/auth/pages/login-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { UsersPage } from '@/features/users/pages/users-page';
import { UserFormPage } from '@/features/users/pages/user-form-page';
import { RolesPage } from '@/features/roles/pages/roles-page';
import { RoleFormPage } from '@/features/roles/pages/role-form-page';
import { ProfilePage } from '@/features/profile/pages/profile-page';
import { CampaignsPage } from '@/features/campaigns/pages/campaigns-page';
import { CampaignFormPage } from '@/features/campaigns/pages/campaign-form-page';
import { CampaignDetailPage } from '@/features/campaigns/pages/campaign-detail-page';
import { CampaignValidatePage } from '@/features/campaigns/pages/campaign-validate-page';
import { LeadsPage } from '@/features/leads/pages/leads-page';
import { LeadFormPage } from '@/features/leads/pages/lead-form-page';
import { PainPointsPage } from '@/features/pain-points/pages/pain-points-page';
import { PainPointFormPage } from '@/features/pain-points/pages/pain-point-form-page';
import { OutreachPage } from '@/features/outreach/pages/outreach-page';
import { OutreachFormPage } from '@/features/outreach/pages/outreach-form-page';
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/features/errors/pages/error-pages';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          {
            element: <PermissionGuard permission={PERMISSIONS.USERS_READ} />,
            children: [{ path: '/users', element: <UsersPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.USERS_CREATE} />,
            children: [{ path: '/users/new', element: <UserFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.USERS_UPDATE} />,
            children: [{ path: '/users/:id', element: <UserFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.ROLES_READ} />,
            children: [{ path: '/roles', element: <RolesPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.ROLES_CREATE} />,
            children: [{ path: '/roles/new', element: <RoleFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.ROLES_UPDATE} />,
            children: [{ path: '/roles/:id', element: <RoleFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.CAMPAIGNS_READ} />,
            children: [
              { path: '/campaigns', element: <CampaignsPage /> },
              { path: '/campaigns/:id', element: <CampaignDetailPage /> },
            ],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.CAMPAIGNS_CREATE} />,
            children: [{ path: '/campaigns/new', element: <CampaignFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.CAMPAIGNS_UPDATE} />,
            children: [{ path: '/campaigns/:id/edit', element: <CampaignFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.LEADS_UPDATE} />,
            children: [{ path: '/campaigns/:id/validate', element: <CampaignValidatePage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.LEADS_READ} />,
            children: [
              { path: '/leads', element: <LeadsPage /> },
              { path: '/leads/:id', element: <LeadFormPage /> },
            ],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.PAIN_POINTS_READ} />,
            children: [{ path: '/pain-points', element: <PainPointsPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.PAIN_POINTS_CREATE} />,
            children: [{ path: '/pain-points/new', element: <PainPointFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.PAIN_POINTS_UPDATE} />,
            children: [{ path: '/pain-points/:id', element: <PainPointFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.OUTREACH_READ} />,
            children: [{ path: '/outreach', element: <OutreachPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.OUTREACH_CREATE} />,
            children: [{ path: '/outreach/new', element: <OutreachFormPage /> }],
          },
          {
            element: <PermissionGuard permission={PERMISSIONS.OUTREACH_READ} />,
            children: [{ path: '/outreach/:id', element: <OutreachFormPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
