import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, MessageCircle } from 'lucide-react';
import type { OutreachListQuery, PublicOutreach } from '@app/shared';
import { PERMISSIONS } from '@app/shared';
import { outreachApi } from '@/services/api/outreach';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { notify } from '@/lib/swal';
import { useAuth } from '@/stores/auth-context';
import { OutreachFilters } from '../components/outreach-filters';
import { OutreachStatusBadge } from '../components/outreach-status-badge';
import {
  EMPTY_OUTREACH_FILTERS,
  filtersFromSearchParams,
  hasActiveFilters,
  toQueryFilters,
  type OutreachFilterValues,
} from '../outreach-filters';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function OutreachPage() {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = filtersFromSearchParams(searchParams);

  const [query, setQuery] = useState<OutreachListQuery>({
    page: 1,
    limit: 10,
    order: 'asc',
    sort: 'nextFollowUpAt',
    ...toQueryFilters(initialFilters),
  });
  const [filters, setFilters] = useState<OutreachFilterValues>(initialFilters);
  const [rows, setRows] = useState<PublicOutreach[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const canCreate = hasPermission(PERMISSIONS.OUTREACH_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.OUTREACH_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.OUTREACH_DELETE);
  const filtered = hasActiveFilters(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await outreachApi.list(query);
      if (result.data.length === 0 && query.page > 1) {
        setQuery((current) => ({ ...current, page: Math.max(1, result.meta.totalPages) }));
        return;
      }
      setRows(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Falha ao listar abordagens');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    const next = toQueryFilters(filters);
    setQuery((current) => ({
      page: 1,
      limit: current.limit,
      sort: current.sort,
      order: current.order,
      ...next,
    }));
    const params = new URLSearchParams();
    if (next.search) params.set('search', next.search);
    if (next.status?.length) params.set('status', next.status.join(','));
    if (next.followUpToday) params.set('followUpToday', 'true');
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    setFilters(EMPTY_OUTREACH_FILTERS);
    setQuery((current) => ({
      page: 1,
      limit: current.limit,
      sort: current.sort,
      order: current.order,
    }));
    setSearchParams({}, { replace: true });
  }

  async function onDelete(row: PublicOutreach) {
    const confirmed = await notify.confirm(
      `Excluir abordagem de "${row.lead.company.name}"?`,
    );
    if (!confirmed) return;
    try {
      await outreachApi.remove(row.id);
      await notify.success('Abordagem excluída');
      await load();
    } catch (err) {
      await notify.error('Erro', isApiError(err) ? err.message : 'Falha ao excluir');
    }
  }

  async function onMarkNoReply() {
    const confirmed = await notify.confirm(
      'Marcar como "Sem resposta" todas as abordagens aguardando resposta há 21 dias ou mais (D0 + 14 + 7)?',
    );
    if (!confirmed) return;
    setMarking(true);
    try {
      const result = await outreachApi.markNoReply();
      await notify.success(
        result.updatedCount === 0
          ? 'Nenhuma abordagem elegível'
          : `${result.updatedCount} abordagem(ns) marcada(s) como Sem resposta`,
      );
      await load();
    } catch (err) {
      await notify.error('Erro', isApiError(err) ? err.message : 'Falha ao atualizar');
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Abordagens</h1>
          <p className="text-sm text-muted">
            Acompanhe contatos, follow-ups e histórico de mensagens por lead
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate ? (
            <Button variant="secondary" loading={marking} onClick={() => void onMarkNoReply()}>
              Marcar sem resposta
            </Button>
          ) : null}
          {canCreate ? (
            <Link to="/outreach/new">
              <Button>Nova abordagem</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <OutreachFilters
          values={filters}
          onChange={setFilters}
          onSubmit={applyFilters}
          onClear={clearFilters}
        />
      </Card>

      <Card>
        {loading ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : rows.length === 0 ? (
          filtered ? (
            <EmptyState
              title="Nenhuma abordagem encontrada"
              description="Nenhuma abordagem corresponde aos filtros aplicados."
              action={
                <Button size="sm" variant="secondary" className="mt-2" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Nenhuma abordagem cadastrada"
              description="Inicie uma abordagem a partir de um lead qualificado."
            />
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">
              {total.toLocaleString('pt-BR')}{' '}
              {total === 1 ? 'abordagem' : 'abordagens'}
            </p>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: 'company',
                  header: 'Empresa',
                  render: (row) => (
                    <Link
                      to={`/outreach/${row.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {row.lead.company.name}
                    </Link>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <OutreachStatusBadge status={row.status} />,
                },
                {
                  key: 'startedAt',
                  header: 'D0',
                  hideOnMobile: true,
                  render: (row) => formatDate(row.startedAt),
                },
                {
                  key: 'nextFollowUpAt',
                  header: 'Próx. follow-up',
                  render: (row) =>
                    row.nextFollowUpAt ? (
                      formatDate(row.nextFollowUpAt)
                    ) : (
                      <span className="text-muted">—</span>
                    ),
                },
                {
                  key: 'whatsapp',
                  header: 'WhatsApp',
                  render: (row) =>
                    row.whatsappLink ? (
                      <a
                        href={row.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                        Abrir
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    ),
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      {canUpdate ? (
                        <Link to={`/outreach/${row.id}`}>
                          <Button size="sm" variant="secondary">
                            Editar
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/outreach/${row.id}`}>
                          <Button size="sm" variant="ghost">
                            Ver
                          </Button>
                        </Link>
                      )}
                      {canDelete ? (
                        <Button size="sm" variant="danger" onClick={() => void onDelete(row)}>
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
            {totalPages > 1 ? (
              <Pagination
                page={query.page}
                totalPages={totalPages}
                onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
              />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
