import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Building2, Globe, Megaphone, Send, type LucideIcon } from 'lucide-react';
import { PERMISSIONS, type DashboardMetrics } from '@app/shared';
import { dashboardApi } from '@/services/api/dashboard';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import { useAuth } from '@/stores/auth-context';
import { CampaignStatusBadge } from '@/features/campaigns/components/campaign-status-badge';

type MetricKey = Exclude<keyof DashboardMetrics, 'recentCampaigns'>;

const METRICS: { key: MetricKey; label: string; icon: LucideIcon }[] = [
  { key: 'totalCampaigns', label: 'Total de campanhas', icon: Megaphone },
  { key: 'companiesFound', label: 'Empresas encontradas', icon: Building2 },
  { key: 'qualifiedLeads', label: 'Leads qualificados', icon: BadgeCheck },
  { key: 'leadsWithoutWebsite', label: 'Leads sem website', icon: Globe },
  { key: 'leadsSentToTrello', label: 'Leads enviados ao Trello', icon: Send },
];

function MetricCard({
  label,
  icon: Icon,
  value,
}: {
  label: string;
  icon: LucideIcon;
  value?: number;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {value === undefined ? (
        <Skeleton className="mt-2 h-9 w-20" />
      ) : (
        <p className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</p>
      )}
    </Card>
  );
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const canViewMetrics =
    hasPermission(PERMISSIONS.CAMPAIGNS_READ) && hasPermission(PERMISSIONS.LEADS_READ);
  const canCreate = hasPermission(PERMISSIONS.CAMPAIGNS_CREATE);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(canViewMetrics);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canViewMetrics) return;
    setLoading(true);
    setError(null);
    try {
      setMetrics(await dashboardApi.metrics());
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Falha ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, [canViewMetrics]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {user ? <p className="text-sm text-muted">Olá, {user.login}</p> : null}
      </div>

      {!canViewMetrics ? (
        <Card>
          <EmptyState
            title="Métricas indisponíveis"
            description="Seu perfil não possui permissão para visualizar campanhas e leads."
          />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void load()} />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {METRICS.map(({ key, label, icon }) => (
              <MetricCard
                key={key}
                label={label}
                icon={icon}
                value={loading ? undefined : metrics?.[key]}
              />
            ))}
          </div>

          <Card
            title="Campanhas recentes"
            actions={
              <Link to="/campaigns">
                <Button size="sm" variant="secondary">
                  Ver todas
                </Button>
              </Link>
            }
          >
            {loading || !metrics ? (
              <SkeletonRows rows={5} />
            ) : metrics.recentCampaigns.length === 0 ? (
              <EmptyState
                title="Nenhuma campanha ainda"
                description="As campanhas criadas aparecerão aqui."
                action={
                  canCreate ? (
                    <Link to="/campaigns/new" className="mt-2">
                      <Button size="sm">Nova campanha</Button>
                    </Link>
                  ) : null
                }
              />
            ) : (
              <Table
                rows={metrics.recentCampaigns}
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
                  { key: 'location', header: 'Local', render: (row) => row.location },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => <CampaignStatusBadge status={row.status} />,
                  },
                  { key: 'companies', header: 'Empresas', render: (row) => row.leadCount },
                  { key: 'leads', header: 'Leads', render: (row) => row.qualifiedLeadCount },
                  {
                    key: 'createdAt',
                    header: 'Data',
                    hideOnMobile: true,
                    render: (row) => new Date(row.createdAt).toLocaleDateString(),
                  },
                ]}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
