import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS, type PublicOutreach } from '@app/shared';
import { AuthContext } from '@/stores/auth-context';
import { outreachApi } from '@/services/api/outreach';
import { OutreachPage } from './outreach-page';

vi.mock('@/services/api/outreach', () => ({
  outreachApi: {
    list: vi.fn(),
    markNoReply: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/swal', () => ({
  notify: {
    confirm: vi.fn(async () => true),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function outreach(id: string, name: string): PublicOutreach {
  return {
    id,
    leadId: `lead-${id}`,
    status: 'WAITING_REPLY',
    startedAt: '2026-01-01T00:00:00.000Z',
    nextFollowUpAt: '2026-01-04T00:00:00.000Z',
    messages: [
      {
        id: `msg-${id}`,
        sentAt: '2026-01-01T00:00:00.000Z',
        message: 'Olá',
        step: 'INITIAL',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    lead: {
      id: `lead-${id}`,
      qualificationStatus: 'QUALIFIED',
      company: {
        id: `c-${id}`,
        name,
        phone: '41999990000',
        whatsappUrl: null,
      },
      campaign: { id: 'camp-1', name: 'Campanha', status: 'COMPLETED' },
    },
    whatsappLink: 'https://wa.me/41999990000',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function renderPage() {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        hasPermission: (permission) =>
          permission === PERMISSIONS.OUTREACH_READ ||
          permission === PERMISSIONS.OUTREACH_UPDATE ||
          permission === PERMISSIONS.OUTREACH_CREATE,
        login: async () => undefined,
        logout: async () => undefined,
        refreshUser: async () => undefined,
      }}
    >
      <MemoryRouter>
        <OutreachPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('OutreachPage', () => {
  beforeEach(() => {
    vi.mocked(outreachApi.list).mockResolvedValue({
      data: [outreach('1', 'Clinica Alpha')],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(outreachApi.markNoReply).mockResolvedValue({ updatedCount: 2 });
  });

  it('lists outreach with WhatsApp link and company name', async () => {
    renderPage();
    expect((await screen.findAllByText('Clinica Alpha')).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Abrir/i })[0]).toHaveAttribute(
      'href',
      'https://wa.me/41999990000',
    );
  });

  it('applies follow-up today filter and runs bulk mark-no-reply', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Clinica Alpha');

    await user.click(screen.getByLabelText('Follow-up de hoje'));
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      expect(outreachApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ followUpToday: true, page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: 'Marcar sem resposta' }));
    await waitFor(() => {
      expect(outreachApi.markNoReply).toHaveBeenCalled();
    });
  });
});
