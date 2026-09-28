import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@app/shared';
import { PermissionGuard } from '@/app/permission-guard';
import { AuthContext } from '@/stores/auth-context';

function renderWithPermission(permissions: string[]) {
  return render(
    <AuthContext.Provider
      value={{
        user: {
          id: '1',
          login: 'tester',
          status: 'active',
          roles: [],
          permissions: permissions as never,
          createdAt: '',
          updatedAt: '',
        },
        loading: false,
        hasPermission: (permission) => (permission ? permissions.includes(permission) : true),
        login: async () => undefined,
        logout: async () => undefined,
        refreshUser: async () => undefined,
      }}
    >
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route element={<PermissionGuard permission={PERMISSIONS.USERS_READ} />}>
            <Route path="/users" element={<div>users-ok</div>} />
          </Route>
          <Route path="/403" element={<div>forbidden</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('PermissionGuard', () => {
  it('renders the route when the user has permission', () => {
    renderWithPermission([PERMISSIONS.USERS_READ]);
    expect(screen.getByText('users-ok')).toBeInTheDocument();
  });

  it('redirects to 403 without permission', () => {
    renderWithPermission([]);
    expect(screen.getByText('forbidden')).toBeInTheDocument();
  });
});
