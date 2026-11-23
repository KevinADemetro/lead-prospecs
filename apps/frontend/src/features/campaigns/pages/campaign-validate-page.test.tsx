import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS, type PublicCampaign, type PublicLead, type PublicLeadDetail } from '@app/shared';
import { AuthContext } from '@/stores/auth-context';
import { campaignsApi } from '@/services/api/campaigns';
import { leadsApi } from '@/services/api/leads';
import { CampaignValidatePage } from './campaign-validate-page';

vi.mock('@/services/api/campaigns', () => ({
  campaignsApi: { get: vi.fn() },
}));

vi.mock('@/services/api/leads', () => ({
  leadsApi: { list: vi.fn(), get: vi.fn(), update: vi.fn(), filterOptions: vi.fn() },
}));

vi.mock('@/lib/swal', () => ({
  notify: { toast: vi.fn(), confirm: vi.fn() },
}));

function campaign(overrides: Partial<PublicCampaign> = {}): PublicCampaign {
  return {
    id: 'camp-1',
    name: 'Padarias',
    description: '',
    location: 'Curitiba, PR',
    city: 'Curitiba',
    state: 'PR',
    categories: ['Padaria'],
    status: 'COMPLETED',
    leadCount: 2,
    qualifiedLeadCount: 0,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function leadSummary(id: string, name: string): PublicLead {
  return {
    id,
    companyId: `c-${id}`,
    campaignId: 'camp-1',
    painPointId: null,
    outreachId: null,
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
  };
}

function leadDetail(id: string, name: string): PublicLeadDetail {
  return {
    ...leadSummary(id, name),
    company: {
      id: `c-${id}`,
      name,
      legalName: null,
      cnpj: null,
      category: 'Padaria',
      niche: null,
      phone: null,
      email: null,
      website: null,
      address: null,
      neighborhood: null,
      city: 'Curitiba',
      state: 'PR',
      country: 'Brasil',
      googleMapsUrl: null,
      googlePlaceId: null,
      whatsappUrl: null,
      instagramUrl: null,
      facebookUrl: null,
      openingHours: null,
      createdAt: '2026-09-01T12:00:00.000Z',
      updatedAt: '2026-09-01T12:00:00.000Z',
    },
  };
}

function renderPage(initialEntry = '/campaigns/camp-1/validate') {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        hasPermission: (permission) =>
          permission === PERMISSIONS.LEADS_UPDATE || permission === PERMISSIONS.CAMPAIGNS_READ,
        login: async () => undefined,
        logout: async () => undefined,
        refreshUser: async () => undefined,
      }}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/campaigns/:id/validate" element={<CampaignValidatePage />} />
          <Route path="/campaigns/:id" element={<div>Detalhe da campanha</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('CampaignValidatePage', () => {
  beforeEach(() => {
    vi.mocked(campaignsApi.get).mockResolvedValue(campaign());
    vi.mocked(leadsApi.filterOptions).mockResolvedValue({
      categories: [],
      cities: [],
      painPoints: [{ id: 'pain-1', name: 'Baixa conversão' }],
    });
    vi.mocked(leadsApi.list).mockResolvedValue({
      data: [leadSummary('1', 'Padaria Alpha'), leadSummary('2', 'Padaria Beta')],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
    vi.mocked(leadsApi.get).mockImplementation(async (id) =>
      leadDetail(id, id === '1' ? 'Padaria Alpha' : 'Padaria Beta'),
    );
    vi.mocked(leadsApi.update).mockImplementation(async (id, input) => ({
      ...leadDetail(id, id === '1' ? 'Padaria Alpha' : 'Padaria Beta'),
      qualificationStatus: input.qualificationStatus ?? 'PENDING',
      painPointId: input.painPointId ?? null,
      painPoint: input.painPointId
        ? { id: input.painPointId, name: 'Baixa conversão' }
        : null,
    }));
  });

  it('saves the current lead and advances to the next one', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Lead 1 de 2 · Padaria Alpha');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Status de qualificação'), 'QUALIFIED');
    await user.click(screen.getByRole('button', { name: 'Próximo' }));

    await waitFor(() => {
      expect(leadsApi.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ qualificationStatus: 'QUALIFIED' }),
      );
    });
    await screen.findByText('Lead 2 de 2 · Padaria Beta');
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
  });

  it('goes back to the previous lead without saving', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Lead 1 de 2 · Padaria Alpha');
    await user.click(screen.getByRole('button', { name: 'Próximo' }));
    await screen.findByText('Lead 2 de 2 · Padaria Beta');

    const updatesAfterNext = vi.mocked(leadsApi.update).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText('Lead 1 de 2 · Padaria Alpha');
    expect(leadsApi.update).toHaveBeenCalledTimes(updatesAfterNext);
  });

  it('starts at the first pending lead and keeps the full counter', async () => {
    vi.mocked(leadsApi.list).mockResolvedValue({
      data: [
        { ...leadSummary('1', 'Padaria Alpha'), qualificationStatus: 'QUALIFIED' },
        { ...leadSummary('2', 'Padaria Beta'), qualificationStatus: 'DISQUALIFIED' },
        leadSummary('3', 'Padaria Gama'),
      ],
      meta: { page: 1, limit: 100, total: 3, totalPages: 1 },
    });
    vi.mocked(leadsApi.get).mockImplementation(async (id) =>
      leadDetail(id, id === '1' ? 'Padaria Alpha' : id === '2' ? 'Padaria Beta' : 'Padaria Gama'),
    );

    renderPage();

    await screen.findByText('Lead 3 de 3 · Padaria Gama');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('shows completion when every lead is already validated', async () => {
    vi.mocked(leadsApi.list).mockResolvedValue({
      data: [
        { ...leadSummary('1', 'Padaria Alpha'), qualificationStatus: 'QUALIFIED' },
        { ...leadSummary('2', 'Padaria Beta'), qualificationStatus: 'DISQUALIFIED' },
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });

    renderPage();

    await screen.findByText('Validação concluída');
  });
});
