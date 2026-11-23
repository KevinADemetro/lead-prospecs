import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS, type PublicLead } from '@app/shared';
import { AuthContext } from '@/stores/auth-context';
import { leadsApi } from '@/services/api/leads';
import { LeadsPage } from './leads-page';

vi.mock('@/services/api/leads', () => ({
  leadsApi: { list: vi.fn(), filterOptions: vi.fn() },
}));

function lead(id: string, name: string, overrides: Partial<PublicLead> = {}): PublicLead {
  return {
    id,
    companyId: `c-${id}`,
    campaignId: 'camp-1',
    painPointId: null,
    websiteStatus: 'NOT_FOUND',
    qualificationStatus: 'PENDING',
    priority: false,
    notes: null,
    painPoint: null,
    company: {
      id: `c-${id}`,
      name,
      category: 'Padaria',
      phone: null,
      website: null,
      city: 'Curitiba',
      state: 'PR',
    },
    campaign: { id: 'camp-1', name: 'Padarias', status: 'COMPLETED' },
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        hasPermission: (permission) => permission === PERMISSIONS.LEADS_READ,
        login: async () => undefined,
        logout: async () => undefined,
        refreshUser: async () => undefined,
      }}
    >
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('LeadsPage', () => {
  beforeEach(() => {
    vi.mocked(leadsApi.filterOptions).mockResolvedValue({
      categories: ['Padaria'],
      cities: [],
      painPoints: [{ id: 'pain-1', name: 'Baixa conversão' }],
    });
    vi.mocked(leadsApi.list).mockResolvedValue({
      data: [lead('1', 'Padaria Alpha'), lead('2', 'Padaria Beta')],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });
  });

  it('selects rows and updates the selection bar', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Padaria Beta');

    await user.click(screen.getAllByLabelText('Selecionar todos da página')[0]!);
    expect(screen.getByText('2 leads selecionados')).toBeInTheDocument();

    await user.click(screen.getAllByLabelText('Selecionar Padaria Alpha')[0]!);
    expect(screen.getByText('1 lead selecionado')).toBeInTheDocument();
  });

  it('sends sort and filters to the API', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Padaria Beta');

    await user.click(screen.getByRole('button', { name: 'Ordenar por Cidade' }));
    await waitFor(() =>
      expect(leadsApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'city', order: 'asc', page: 1 }),
      ),
    );

    await user.type(screen.getByLabelText('Buscar leads'), 'alpha');
    await user.selectOptions(screen.getByLabelText('Website'), 'ERROR');
    await user.click(screen.getByLabelText('Qualificado'));
    await user.click(screen.getByLabelText('Pendente'));
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() =>
      expect(leadsApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'alpha',
          websiteStatus: 'ERROR',
          qualificationStatus: ['QUALIFIED', 'PENDING'],
        }),
      ),
    );
  });

  it('links company name to the lead form page', async () => {
    renderPage();
    const link = (await screen.findAllByRole('link', { name: 'Padaria Alpha' }))[0]!;
    expect(link).toHaveAttribute('href', '/leads/1');
  });

  it('shows an error state with retry', async () => {
    vi.mocked(leadsApi.list).mockRejectedValueOnce({ status: 500, message: 'Falha no servidor' });
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Falha no servidor')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findAllByText('Padaria Beta')).not.toHaveLength(0);
  });
});
