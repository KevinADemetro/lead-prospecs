import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './login-page';
import { AuthContext } from '@/stores/auth-context';

function renderLogin(login = vi.fn()) {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        hasPermission: () => false,
        login,
        logout: vi.fn(),
        refreshUser: vi.fn(),
      }}
    >
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('LoginPage', () => {
  it('shows field validation messages', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findAllByText(/Login deve ter/i)).toHaveLength(1);
  });

  it('submits valid credentials', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin(login);
    await user.type(screen.getByLabelText('Login'), 'admin');
    await user.type(screen.getByLabelText('Senha'), 'ChangeMe!Admin12');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(login).toHaveBeenCalledWith('admin', 'ChangeMe!Admin12');
  });
});
