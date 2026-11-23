import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  PERMISSIONS,
  type LeadFilterOptions,
  type PublicCampaign,
  type PublicLead,
  type PublicLeadDetail,
} from '@app/shared';
import { campaignsApi } from '@/services/api/campaigns';
import { leadsApi } from '@/services/api/leads';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, EmptyStateAction } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/swal';
import { useAuth } from '@/stores/auth-context';
import { LeadFormFields } from '@/features/leads/components/lead-form-fields';
import {
  emptyLeadFormValues,
  leadFormSchema,
  toLeadFormValues,
  toUpdateLeadInput,
  type LeadFormValues,
} from '@/features/leads/lead-form';
import {
  findFirstPendingIndex,
  findNextPendingIndex,
  isLeadPending,
  listCampaignLeadQueue,
} from '../campaign-validate';

const EMPTY_PAIN_POINTS: LeadFilterOptions['painPoints'] = [];

function FormSkeleton() {
  return (
    <Card>
      <div className="grid max-w-3xl gap-4" role="status" aria-label="Carregando">
        <Skeleton className="h-7 w-64" />
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function CampaignValidatePage() {
  const { id: campaignId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.LEADS_UPDATE);

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [queue, setQueue] = useState<PublicLead[]>([]);
  const [lead, setLead] = useState<PublicLeadDetail | null>(null);
  const [painPoints, setPainPoints] = useState(EMPTY_PAIN_POINTS);
  const [queueLoading, setQueueLoading] = useState(true);
  const [leadLoading, setLeadLoading] = useState(false);
  const [queueError, setQueueError] = useState<{ status?: number; message: string } | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: emptyLeadFormValues(),
  });

  const leadIdFromUrl = searchParams.get('leadId');
  const currentIndex = useMemo(() => {
    if (queue.length === 0) return -1;
    if (!leadIdFromUrl) return 0;
    const index = queue.findIndex((item) => item.id === leadIdFromUrl);
    return index >= 0 ? index : 0;
  }, [queue, leadIdFromUrl]);
  const currentLeadId = currentIndex >= 0 ? queue[currentIndex]?.id : undefined;
  const isFirst = currentIndex <= 0;
  const nextPendingIndex = currentIndex >= 0 ? findNextPendingIndex(queue, currentIndex) : -1;
  const isLastPending = currentIndex >= 0 && nextPendingIndex < 0;
  const pendingCount = useMemo(
    () => queue.filter((item) => isLeadPending(item)).length,
    [queue],
  );
  const allValidated = queue.length > 0 && pendingCount === 0;

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const [campaignDetail, leads, options] = await Promise.all([
        campaignsApi.get(campaignId),
        listCampaignLeadQueue(campaignId),
        leadsApi.filterOptions(),
      ]);
      setCampaign(campaignDetail);
      setQueue(leads);
      setPainPoints(options.painPoints);
      if (leads.length > 0) {
        setSearchParams(
          (prev) => {
            const current = prev.get('leadId');
            if (current && leads.some((item) => item.id === current)) {
              return { leadId: current };
            }
            const firstPending = findFirstPendingIndex(leads);
            if (firstPending < 0) return new URLSearchParams();
            return { leadId: leads[firstPending]!.id };
          },
          { replace: true },
        );
      }
    } catch (error) {
      setQueueError(
        isApiError(error)
          ? { status: error.status, message: error.message }
          : { message: 'Falha ao carregar campanha' },
      );
    } finally {
      setQueueLoading(false);
    }
  }, [campaignId, setSearchParams]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const loadLead = useCallback(async (leadId: string) => {
    setLeadLoading(true);
    setLeadError(null);
    try {
      const detail = await leadsApi.get(leadId);
      setLead(detail);
      form.reset(toLeadFormValues(detail));
    } catch (error) {
      setLead(null);
      setLeadError(isApiError(error) ? error.message : 'Falha ao carregar lead');
    } finally {
      setLeadLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (!currentLeadId) {
      setLead(null);
      return;
    }
    void loadLead(currentLeadId);
  }, [currentLeadId, loadLead]);

  function goToIndex(index: number) {
    const next = queue[index];
    if (!next) return;
    setSearchParams({ leadId: next.id });
  }

  async function saveAndAdvance(values: LeadFormValues) {
    if (!canUpdate || !currentLeadId) return;
    setSaving(true);
    try {
      const updated = await leadsApi.update(currentLeadId, toUpdateLeadInput(values));
      setLead(updated);
      form.reset(toLeadFormValues(updated));

      const nextQueue = queue.map((item) =>
        item.id === currentLeadId
          ? {
              ...item,
              qualificationStatus: updated.qualificationStatus,
              painPointId: updated.painPointId,
              painPoint: updated.painPoint,
            }
          : item,
      );
      setQueue(nextQueue);

      const nextPending = findNextPendingIndex(nextQueue, currentIndex);
      if (nextPending >= 0) {
        void notify.toast('Lead salvo');
        goToIndex(nextPending);
        return;
      }

      if (isLeadPending(updated.qualificationStatus)) {
        void notify.toast('Lead salvo');
        return;
      }

      void notify.toast('Validação concluída');
      navigate(`/campaigns/${campaignId}`);
    } catch (error) {
      void notify.toast(isApiError(error) ? error.message : 'Falha ao salvar lead', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (queueLoading) return <FormSkeleton />;

  if (queueError || !campaign) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit" onClick={() => navigate('/campaigns')}>
          Voltar
        </Button>
        {queueError?.status === 404 ? (
          <ErrorState title="Campanha não encontrada" message="Ela pode ter sido excluída." />
        ) : (
          <ErrorState
            message={queueError?.message ?? 'Falha ao carregar campanha'}
            onRetry={() => void loadQueue()}
          />
        )}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Link to={`/campaigns/${campaignId}`} className="text-sm text-muted hover:text-primary">
          ← {campaign.name}
        </Link>
        <Card>
          <EmptyState
            title="Nenhum lead para validar"
            description="Execute a campanha para gerar leads antes de validá-los."
            action={
              <Link to={`/campaigns/${campaignId}`}>
                <EmptyStateAction variant="secondary">Voltar à campanha</EmptyStateAction>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  if (allValidated && !leadIdFromUrl) {
    return (
      <div className="flex flex-col gap-4">
        <Link to={`/campaigns/${campaignId}`} className="text-sm text-muted hover:text-primary">
          ← {campaign.name}
        </Link>
        <Card>
          <EmptyState
            title="Validação concluída"
            description="Todos os leads desta campanha já estão qualificados ou desqualificados."
            action={
              <Link to={`/campaigns/${campaignId}`}>
                <EmptyStateAction variant="secondary">Voltar à campanha</EmptyStateAction>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  if (!canUpdate) {
    return (
      <div className="flex flex-col gap-4">
        <Link to={`/campaigns/${campaignId}`} className="text-sm text-muted hover:text-primary">
          ← {campaign.name}
        </Link>
        <ErrorState
          title="Sem permissão"
          message="Você precisa de permissão para atualizar leads e validar a campanha."
        />
      </div>
    );
  }

  const disabled = saving || leadLoading;

  return (
    <div className="relative flex flex-col gap-4 pr-0 md:pr-36">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link to={`/campaigns/${campaignId}`} className="text-sm text-muted hover:text-primary">
            ← {campaign.name}
          </Link>
          <h1 className="text-2xl font-semibold">Validar campanha</h1>
          <p className="text-sm text-muted">
            Lead {currentIndex + 1} de {queue.length}
            {lead ? ` · ${lead.company.name}` : null}
          </p>
        </div>
        <div
          className="h-2 w-40 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={queue.length}
          aria-valuenow={currentIndex + 1}
          aria-label="Progresso da validação"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {leadLoading && !lead ? <FormSkeleton /> : null}

      {leadError && !leadLoading ? (
        <ErrorState message={leadError} onRetry={() => currentLeadId && void loadLead(currentLeadId)} />
      ) : null}

      {lead ? (
        <Card title="Avaliar lead">
          <form
            id="campaign-validate-form"
            className="grid max-w-3xl gap-8"
            onSubmit={form.handleSubmit(saveAndAdvance)}
            noValidate
          >
            <LeadFormFields
              form={form}
              disabled={disabled}
              painPoints={painPoints}
              googlePlaceId={lead.company.googlePlaceId}
              companyNameFallback={lead.company.name}
            />
          </form>
        </Card>
      ) : null}

      {lead ? (
        <aside
          className="fixed bottom-4 right-4 z-20 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 shadow-lg md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          aria-label="Navegação da validação"
        >
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || isFirst}
            onClick={() => goToIndex(currentIndex - 1)}
          >
            Anterior
          </Button>
          <Button
            type="submit"
            form="campaign-validate-form"
            loading={saving}
            disabled={leadLoading}
          >
            {isLastPending ? 'Concluir' : 'Próximo'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => navigate(`/campaigns/${campaignId}`)}
          >
            Sair
          </Button>
        </aside>
      ) : null}
    </div>
  );
}
