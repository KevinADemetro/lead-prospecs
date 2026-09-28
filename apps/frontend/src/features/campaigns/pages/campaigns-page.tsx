import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { isApiError } from '@/services/api/client';
import { useAuth } from '@/stores/auth-context';
import { CAMPAIGN_STATUS_LABELS } from '../campaign-labels';
import { CampaignActions } from '../components/campaign-actions';
import { CampaignStatusBadge } from '../components/campaign-status-badge';

const initial: CampaignListQuery = { page: 1, limit: 10, order: 'desc', sort: 'createdAt' };

export function CampaignsPage() {
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState<CampaignListQuery>(initial);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [rows, setRows] = useState<PublicCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreate = hasPermission(PERMISSIONS.CAMPAIGNS_CREATE);
  const hasFilters = Boolean(query.search || query.status);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaignsApi.list(query);
      if (result.data.length === 0 && query.page > 1) {
        setQuery((current) => ({ ...current, page: current.page - 1 }));
        return;
      }
      setRows(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Falha ao listar campanhas');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setQuery({
      ...query,
      page: 1,
      search: filters.search || undefined,
      status: filters.status ? (filters.status as CampaignStatus) : undefined,
    });
  }

  function clearFilters() {
    setFilters({ search: '', status: '' });
    setQuery(initial);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
        {canCreate ? (
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
          <SkeletonRows />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              title="Nenhuma campanha encontrada"
              description="Nenhuma campanha corresponde aos filtros aplicados."
              action={
                <Button size="sm" variant="secondary" className="mt-2" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Nenhuma campanha cadastrada"
              description="Crie uma campanha para começar a prospectar empresas."
              action={
                canCreate ? (
                  <Link to="/campaigns/new" className="mt-2">
                    <Button size="sm">Nova campanha</Button>
                  </Link>
                ) : null
              }
            />
          )
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: 'name',
                  header: 'Nome',
                  render: (row) => (
                    <Link to={`/campaigns/${row.id}`} className="font-medium hover:text-primary">
                      {row.name}
                    </Link>
                  ),
                },
                {
                  key: 'location',
                  header: 'Local',
                  hideOnMobile: true,
                  render: (row) => row.location,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <CampaignStatusBadge status={row.status} />,
                },
                { key: 'companies', header: 'Empresas', render: (row) => row.leadCount },
                { key: 'leads', header: 'Leads', render: (row) => row.qualifiedLeadCount },
                {
                  key: 'createdAt',
                  header: 'Criada em',
                  hideOnMobile: true,
                  render: (row) => new Date(row.createdAt).toLocaleString(),
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  render: (row) => <CampaignActions campaign={row} onChanged={() => void load()} />,
                },
              ]}
            />
            {total > query.limit ? (
              <Pagination
                page={query.page}
                totalPages={totalPages}
                onPageChange={(page) => setQuery({ ...query, page })}
              />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
