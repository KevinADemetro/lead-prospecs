import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS, type PublicLead, type PublicLeadDetail } from '@app/shared';
import { AuthContext } from '@/stores/auth-context';
import { leadsApi } from '@/services/api/leads';
import { LeadsPage } from './leads-page';

vi.mock('@/services/api/leads', () => ({
  leadsApi: { list: vi.fn(), get: vi.fn(), filterOptions: vi.fn() },
}));

function lead(id: string, name: string, overrides: Partial<PublicLead> = {}): PublicLead {
  return {
    id,
    companyId: `c-${id}`,
    campaignId: 'camp-1',
    websiteStatus: 'NOT_FOUND',
    whatsappStatus: 'UNKNOWN',
    instagramStatus: 'UNKNOWN',
    facebookStatus: 'UNKNOWN',
    qualificationStatus: 'PENDING',
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

const detail: PublicLeadDetail = {
  ...lead('1', 'Padaria Alpha', {
    websiteStatus: 'FOUND',
  }),
  company: {
    id: 'c-1',
    name: 'Padaria Alpha',
    legalName: 'Alpha Pães Ltda',
    cnpj: '11222333000181',
    category: 'Padaria',
    phone: '(41) 3333-4444',
    email: 'contato@alpha.com',
    website: 'alpha.com.br',
    address: 'Rua XV, 10',
    city: 'Curitiba',
    state: 'PR',
    country: 'BR',
    googlePlaceId: 'place-1',
    googleMapsUrl: null,
    instagramUrl: 'javascript:alert(1)',
    facebookUrl: 'https://facebook.com/alpha',
    createdAt: '',
    updatedAt: '',
  },
};

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
    vi.mocked(leadsApi.filterOptions).mockResolvedValue({ categories: ['Padaria'], cities: [] });
    vi.mocked(leadsApi.list).mockResolvedValue({
      data: [lead('1', 'Padaria Alpha'), lead('2', 'Padaria Beta')],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });
    vi.mocked(leadsApi.get).mockResolvedValue(detail);
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
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() =>
      expect(leadsApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'alpha', websiteStatus: 'ERROR' }),
      ),
    );
  });

  it('opens lead details with safe external links in a new tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click((await screen.findAllByRole('button', { name: 'Padaria Alpha' }))[0]!);

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Alpha Pães Ltda')).toBeInTheDocument();
    expect(within(dialog).getByText('11.222.333/0001-81')).toBeInTheDocument();

    const website = within(dialog).getByRole('link', { name: 'Website' });
    expect(website).toHaveAttribute('href', 'https://alpha.com.br/');
    expect(website).toHaveAttribute('target', '_blank');
    expect(website).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(dialog).getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
      'href',
      expect.stringContaining('query_place_id=place-1'),
    );
    expect(within(dialog).queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'target',
      '_blank',
    );
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
