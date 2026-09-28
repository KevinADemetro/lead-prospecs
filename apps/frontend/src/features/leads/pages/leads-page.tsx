import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LeadListQuery, PublicCampaign, PublicLead, QualificationStatus } from '@app/shared';
import { PERMISSIONS, QUALIFICATION_STATUSES } from '@app/shared';
import { leadsApi } from '@/services/api/leads';
import { campaignsApi } from '@/services/api/campaigns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';
import { useAuth } from '@/stores/auth-context';
import { QUALIFICATION_STATUS_LABELS } from '../lead-labels';

export function LeadsPage() {
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCampaignId = searchParams.get('campaignId') ?? '';
  const [query, setQuery] = useState<LeadListQuery>({
    page: 1,
    limit: 10,
    order: 'desc',
    sort: 'createdAt',
    campaignId: initialCampaignId || undefined,
  });
  const [filters, setFilters] = useState({
    search: '',
    campaignId: initialCampaignId,
    qualificationStatus: '',
  });
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [rows, setRows] = useState<PublicLead[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const canReadCampaigns = hasPermission(PERMISSIONS.CAMPAIGNS_READ);

  useEffect(() => {
    if (!canReadCampaigns) return;
    void campaignsApi
      .list({ page: 1, limit: 100, order: 'desc', sort: 'createdAt' })
      .then((result) => setCampaigns(result.data))
      .catch(() => setCampaigns([]));
  }, [canReadCampaigns]);

  async function load(next = query) {
    setLoading(true);
    try {
      const result = await leadsApi.list(next);
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao listar leads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.search, query.campaignId, query.qualificationStatus]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setQuery({
      ...query,
      page: 1,
      search: filters.search || undefined,
      campaignId: filters.campaignId || undefined,
      qualificationStatus: filters.qualificationStatus
        ? (filters.qualificationStatus as QualificationStatus)
        : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Leads</h1>
      <Card>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_200px_auto]"
          onSubmit={applyFilters}
        >
          <Input
            placeholder="Buscar por empresa"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          {canReadCampaigns ? (
            <Select
              value={filters.campaignId}
              onChange={(event) => setFilters({ ...filters, campaignId: event.target.value })}
              aria-label="Campanha"
            >
              <option value="">Todas as campanhas</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Select
            value={filters.qualificationStatus}
            onChange={(event) =>
              setFilters({ ...filters, qualificationStatus: event.target.value })
            }
            aria-label="Qualificação"
          >
            <option value="">Todas as qualificações</option>
            {QUALIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {QUALIFICATION_STATUS_LABELS[status].label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>
      <Card>
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum lead encontrado"
            description="Leads aparecem aqui quando campanhas encontram empresas."
          />
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                { key: 'company', header: 'Empresa', render: (row) => row.company.name },
                {
                  key: 'city',
                  header: 'Cidade',
                  hideOnMobile: true,
                  render: (row) =>
                    [row.company.city, row.company.state].filter(Boolean).join(' / ') || '—',
                },
                {
                  key: 'phone',
                  header: 'Telefone',
                  hideOnMobile: true,
                  render: (row) => row.company.phone ?? '—',
                },
                { key: 'campaign', header: 'Campanha', render: (row) => row.campaign.name },
                {
                  key: 'qualification',
                  header: 'Qualificação',
                  render: (row) => (
                    <Badge tone={QUALIFICATION_STATUS_LABELS[row.qualificationStatus].tone}>
                      {QUALIFICATION_STATUS_LABELS[row.qualificationStatus].label}
                    </Badge>
                  ),
                },
                { key: 'score', header: 'Score', render: (row) => row.score ?? '—' },
                {
                  key: 'createdAt',
                  header: 'Criado em',
                  hideOnMobile: true,
                  render: (row) => new Date(row.createdAt).toLocaleString(),
                },
              ]}
            />
            <Pagination
              page={query.page}
              totalPages={totalPages}
              onPageChange={(page) => setQuery({ ...query, page })}
            />
          </>
        )}
      </Card>
    </div>
  );
}
