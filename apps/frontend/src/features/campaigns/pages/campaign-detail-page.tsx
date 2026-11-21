import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PERMISSIONS, type PublicCampaign } from '@app/shared';
import { campaignsApi } from '@/services/api/campaigns';
import { isApiError } from '@/services/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/stores/auth-context';
import { describeCampaignFilters } from '../campaign-labels';
import { CampaignActions } from '../components/campaign-actions';
import { CampaignStatusBadge } from '../components/campaign-status-badge';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function TagList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <span className="text-muted">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} tone="info">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Carregando">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export function CampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCampaign(await campaignsApi.get(id));
    } catch (err) {
      setError(
        isApiError(err)
          ? { status: err.status, message: err.message }
          : { message: 'Falha ao carregar campanha' },
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <DetailSkeleton />;

  if (error || !campaign) {
    return (
      <Card>
        {error?.status === 404 ? (
          <ErrorState title="Campanha não encontrada" message="Ela pode ter sido excluída." />
        ) : (
          <ErrorState message={error?.message} onRetry={() => void load()} />
        )}
        <div className="flex justify-center">
          <Link to="/campaigns">
            <Button variant="secondary" size="sm">
              Voltar para campanhas
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const filters = describeCampaignFilters(campaign.filters);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link to="/campaigns" className="text-sm text-muted hover:text-primary">
            ← Campanhas
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{campaign.name}</h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
        </div>
        <CampaignActions
          campaign={campaign}
          showView={false}
          onChanged={() => void load()}
          onDeleted={() => navigate('/campaigns')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Empresas encontradas</p>
          <p className="mt-1 text-3xl font-semibold">{campaign.leadCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Leads qualificados</p>
          <p className="mt-1 text-3xl font-semibold">{campaign.qualifiedLeadCount}</p>
        </Card>
      </div>

      <Card
        title="Configuração"
        actions={
          hasPermission(PERMISSIONS.LEADS_READ) ? (
            <Link to={`/leads?campaignId=${campaign.id}`}>
              <Button size="sm" variant="secondary">
                Ver leads
              </Button>
            </Link>
          ) : null
        }
      >
        <dl className="grid gap-4 md:grid-cols-2">
          <Field label="Descrição">
            {campaign.description || <span className="text-muted">Sem descrição</span>}
          </Field>
          <Field label="Local">{campaign.location}</Field>
          <Field label="Categorias">
            <TagList items={campaign.categories} empty="Nenhuma categoria" />
          </Field>
          <Field label="Filtros">
            <TagList items={filters} empty="Nenhum filtro aplicado" />
          </Field>
          <Field label="Criada em">{new Date(campaign.createdAt).toLocaleString()}</Field>
        </dl>
      </Card>
    </div>
  );
}
