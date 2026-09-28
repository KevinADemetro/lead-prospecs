import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink as ExternalLinkIcon, Star } from 'lucide-react';
import type {
  LeadFilterOptions,
  LeadListQuery,
  LeadSortField,
  PublicCampaign,
  PublicLead,
} from '@app/shared';
import { PERMISSIONS } from '@app/shared';
import { leadsApi } from '@/services/api/leads';
import { campaignsApi } from '@/services/api/campaigns';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { toExternalUrl } from '@/lib/external-url';
import { useAuth } from '@/stores/auth-context';
import { LeadFilters } from '../components/lead-filters';
import {
  EMPTY_LEAD_FILTERS,
  hasActiveFilters,
  toQueryFilters,
  type LeadFilterValues,
} from '../lead-filters';
import {
  QualificationBadge,
  ScoreBadge,
  TrelloStatusBadge,
  WebsiteStatusBadge,
  WhatsappStatusBadge,
} from '../components/lead-badges';
import { LeadDetailsDrawer } from '../components/lead-details-drawer';
import { SendToTrelloButton } from '../components/send-to-trello-button';
import { SortHeader } from '../components/sort-header';
import { formatCityState, formatCount, formatRating } from '../lead-format';

const PAGE_SIZES = [10, 25, 50, 100] as const;

/** Text columns start ascending; numeric/date columns start with the highest values. */
const DEFAULT_ORDER: Record<LeadSortField, 'asc' | 'desc'> = {
  createdAt: 'desc',
  companyName: 'asc',
  category: 'asc',
  city: 'asc',
  googleRating: 'desc',
  googleReviewCount: 'desc',
  score: 'desc',
};

const EMPTY_OPTIONS: LeadFilterOptions = { categories: [], cities: [] };

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
  const [filters, setFilters] = useState<LeadFilterValues>({
    ...EMPTY_LEAD_FILTERS,
    campaignId: initialCampaignId,
  });
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [options, setOptions] = useState<LeadFilterOptions>(EMPTY_OPTIONS);
  const [rows, setRows] = useState<PublicLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const canReadCampaigns = hasPermission(PERMISSIONS.CAMPAIGNS_READ);

  const { page, limit, sort, order, ...activeFilters } = query;
  const filtered = hasActiveFilters(activeFilters);

  useEffect(() => {
    if (!canReadCampaigns) return;
    void campaignsApi
      .list({ page: 1, limit: 100, order: 'desc', sort: 'createdAt' })
      .then((result) => setCampaigns(result.data))
      .catch(() => setCampaigns([]));
  }, [canReadCampaigns]);

  useEffect(() => {
    void leadsApi
      .filterOptions()
      .then(setOptions)
      .catch(() => setOptions(EMPTY_OPTIONS));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadsApi.list(query);
      if (result.data.length === 0 && query.page > 1) {
        setQuery((current) => ({ ...current, page: Math.max(1, result.meta.totalPages) }));
        return;
      }
      setRows(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Falha ao listar leads');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setSelected(new Set());
    setQuery((current) => ({ ...current, page: 1, ...toQueryFilters(filters) }));
  }

  function clearFilters() {
    setFilters(EMPTY_LEAD_FILTERS);
    setSelected(new Set());
    setQuery((current) => ({
      page: 1,
      limit: current.limit,
      sort: current.sort,
      order: current.order,
    }));
  }

  function changeSort(field: LeadSortField) {
    setQuery((current) => ({
      ...current,
      page: 1,
      sort: field,
      order:
        current.sort === field ? (current.order === 'asc' ? 'desc' : 'asc') : DEFAULT_ORDER[field],
    }));
  }

  const pageIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;

  function toggleRow(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      pageIds.forEach((id) => (allOnPageSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const closeDetails = useCallback(() => setDetailId(null), []);
  const sortProps = { sort, order, onSort: changeSort };
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Leads</h1>
        {!loading && !error ? (
          <p className="text-sm text-muted">
            {total.toLocaleString('pt-BR')} {total === 1 ? 'lead' : 'leads'}
          </p>
        ) : null}
      </div>

      <Card>
        <LeadFilters
          values={filters}
          options={options}
          campaigns={canReadCampaigns ? campaigns : null}
          onChange={setFilters}
          onSubmit={applyFilters}
          onClear={clearFilters}
        />
      </Card>

      {selected.size > 0 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3"
          role="region"
          aria-label="Ações em lote"
        >
          <p className="text-sm font-medium">
            {selected.size} {selected.size === 1 ? 'lead selecionado' : 'leads selecionados'}
          </p>
          <div className="flex flex-wrap gap-2">
            <SendToTrelloButton count={selected.size} />
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Limpar seleção
            </Button>
          </div>
        </div>
      ) : null}

      <Card>
        {loading ? (
          <SkeletonRows rows={Math.min(limit, 8)} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : rows.length === 0 ? (
          filtered ? (
            <EmptyState
              title="Nenhum lead encontrado"
              description="Nenhum lead corresponde à busca ou aos filtros aplicados."
              action={
                <Button size="sm" variant="secondary" className="mt-2" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Nenhum lead cadastrado"
              description="Leads aparecem aqui quando campanhas encontram empresas."
            />
          )
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              rowClassName={(row) => (selected.has(row.id) ? 'bg-primary/5' : undefined)}
              columns={[
                {
                  key: 'select',
                  mobileLabel: 'Selecionar',
                  className: 'w-10',
                  header: (
                    <Checkbox
                      aria-label="Selecionar todos da página"
                      checked={allOnPageSelected}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate = selectedOnPage > 0 && !allOnPageSelected;
                        }
                      }}
                      onChange={togglePage}
                    />
                  ),
                  render: (row) => (
                    <Checkbox
                      aria-label={`Selecionar ${row.company.name}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                    />
                  ),
                },
                {
                  key: 'company',
                  mobileLabel: 'Empresa',
                  header: <SortHeader field="companyName" label="Empresa" {...sortProps} />,
                  render: (row) => (
                    <button
                      type="button"
                      className="text-left font-medium hover:text-primary hover:underline"
                      onClick={() => setDetailId(row.id)}
                    >
                      {row.company.name}
                    </button>
                  ),
                },
                {
                  key: 'category',
                  mobileLabel: 'Categoria',
                  hideOnMobile: true,
                  header: <SortHeader field="category" label="Categoria" {...sortProps} />,
                  render: (row) => row.company.category ?? <span className="text-muted">—</span>,
                },
                {
                  key: 'city',
                  mobileLabel: 'Cidade',
                  header: <SortHeader field="city" label="Cidade" {...sortProps} />,
                  render: (row) =>
                    formatCityState(row.company.city, row.company.state) ?? (
                      <span className="text-muted">—</span>
                    ),
                },
                {
                  key: 'website',
                  header: 'Website',
                  render: (row) => {
                    const href = toExternalUrl(row.company.website);
                    return (
                      <span className="inline-flex items-center gap-1">
                        <WebsiteStatusBadge status={row.websiteStatus} />
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted hover:text-primary"
                            aria-label={`Abrir website de ${row.company.name}`}
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </span>
                    );
                  },
                },
                {
                  key: 'whatsapp',
                  header: 'WhatsApp',
                  hideOnMobile: true,
                  render: (row) => <WhatsappStatusBadge status={row.whatsappStatus} />,
                },
                {
                  key: 'rating',
                  mobileLabel: 'Google Rating',
                  hideOnMobile: true,
                  header: <SortHeader field="googleRating" label="Google Rating" {...sortProps} />,
                  render: (row) =>
                    row.company.googleRating === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
                        {formatRating(row.company.googleRating)}
                      </span>
                    ),
                },
                {
                  key: 'reviews',
                  mobileLabel: 'Avaliações',
                  hideOnMobile: true,
                  header: (
                    <SortHeader field="googleReviewCount" label="Avaliações" {...sortProps} />
                  ),
                  render: (row) =>
                    formatCount(row.company.googleReviewCount) ?? (
                      <span className="text-muted">—</span>
                    ),
                },
                {
                  key: 'score',
                  mobileLabel: 'Score',
                  header: <SortHeader field="score" label="Score" {...sortProps} />,
                  render: (row) => <ScoreBadge score={row.score} />,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <QualificationBadge status={row.qualificationStatus} />,
                },
                {
                  key: 'trello',
                  header: 'Trello',
                  hideOnMobile: true,
                  render: (row) => <TrelloStatusBadge status={row.trelloStatus} />,
                },
              ]}
            />
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-2 pt-4 text-sm text-muted">
                <span>
                  Mostrando {firstItem}–{lastItem} de {total.toLocaleString('pt-BR')}
                </span>
                <Select
                  className="h-9 w-auto"
                  aria-label="Itens por página"
                  value={limit}
                  onChange={(event) =>
                    setQuery((current) => ({
                      ...current,
                      page: 1,
                      limit: Number(event.target.value),
                    }))
                  }
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} por página
                    </option>
                  ))}
                </Select>
              </div>
              {totalPages > 1 ? (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(next) => setQuery((current) => ({ ...current, page: next }))}
                />
              ) : null}
            </div>
          </>
        )}
      </Card>

      <LeadDetailsDrawer leadId={detailId} onClose={closeDetails} />
    </div>
  );
}
