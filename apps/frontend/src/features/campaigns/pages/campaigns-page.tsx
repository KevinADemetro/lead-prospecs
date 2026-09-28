import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CampaignListQuery, CampaignStatus, PublicCampaign } from '@app/shared';
import { CAMPAIGN_STATUSES, PERMISSIONS } from '@app/shared';
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
import { CAMPAIGN_STATUS_LABELS } from '../campaign-labels';

const initial: CampaignListQuery = { page: 1, limit: 10, order: 'desc', sort: 'createdAt' };

export function CampaignsPage() {
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState<CampaignListQuery>(initial);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [rows, setRows] = useState<PublicCampaign[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(next = query) {
    setLoading(true);
    try {
      const result = await campaignsApi.list(next);
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao listar campanhas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.search, query.status]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setQuery({
      ...query,
      page: 1,
      search: filters.search || undefined,
      status: filters.status ? (filters.status as CampaignStatus) : undefined,
    });
  }

  async function onDelete(campaign: PublicCampaign) {
    const confirmed = await notify.confirm(`Excluir campanha ${campaign.name}?`);
    if (!confirmed) return;
    try {
      await campaignsApi.remove(campaign.id);
      await notify.success('Campanha excluída');
      await load();
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao excluir');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
        {hasPermission(PERMISSIONS.CAMPAIGNS_CREATE) ? (
          <Link to="/campaigns/new">
            <Button>Nova campanha</Button>
          </Link>
        ) : null}
      </div>
      <Card>
        <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" onSubmit={applyFilters}>
          <Input
            placeholder="Buscar por nome"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          <Select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            aria-label="Status"
          >
            <option value="">Todos os status</option>
            {CAMPAIGN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CAMPAIGN_STATUS_LABELS[status].label}
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
            title="Nenhuma campanha encontrada"
            description="Ajuste os filtros ou crie uma nova campanha."
          />
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                { key: 'name', header: 'Nome', render: (row) => row.name },
                {
                  key: 'location',
                  header: 'Localização',
                  hideOnMobile: true,
                  render: (row) => row.location,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge tone={CAMPAIGN_STATUS_LABELS[row.status].tone}>
                      {CAMPAIGN_STATUS_LABELS[row.status].label}
                    </Badge>
                  ),
                },
                { key: 'leads', header: 'Leads', render: (row) => row.leadCount },
                {
                  key: 'createdAt',
                  header: 'Criada em',
                  hideOnMobile: true,
                  render: (row) => new Date(row.createdAt).toLocaleString(),
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      {hasPermission(PERMISSIONS.LEADS_READ) ? (
                        <Link to={`/leads?campaignId=${row.id}`}>
                          <Button size="sm" variant="secondary">
                            Leads
                          </Button>
                        </Link>
                      ) : null}
                      {hasPermission(PERMISSIONS.CAMPAIGNS_UPDATE) && row.status === 'DRAFT' ? (
                        <Link to={`/campaigns/${row.id}`}>
                          <Button size="sm" variant="secondary">
                            Editar
                          </Button>
                        </Link>
                      ) : null}
                      {hasPermission(PERMISSIONS.CAMPAIGNS_DELETE) && row.status !== 'RUNNING' ? (
                        <Button size="sm" variant="danger" onClick={() => void onDelete(row)}>
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ),
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
