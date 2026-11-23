import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PERMISSIONS, type LeadFilterOptions, type PublicLeadDetail } from '@app/shared';
import { leadsApi } from '@/services/api/leads';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/swal';
import { useAuth } from '@/stores/auth-context';
import { LeadFormFields } from '../components/lead-form-fields';
import {
  emptyLeadFormValues,
  leadFormSchema,
  toLeadFormValues,
  toUpdateLeadInput,
  type LeadFormValues,
} from '../lead-form';

const EMPTY_DORES: LeadFilterOptions['dores'] = [];

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

export function LeadFormPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.LEADS_UPDATE);
  const canReadCampaigns = hasPermission(PERMISSIONS.CAMPAIGNS_READ);

  const [lead, setLead] = useState<PublicLeadDetail | null>(null);
  const [dores, setDores] = useState(EMPTY_DORES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: emptyLeadFormValues(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [detail, options] = await Promise.all([leadsApi.get(id), leadsApi.filterOptions()]);
      setLead(detail);
      setDores(options.dores);
      form.reset(toLeadFormValues(detail));
    } catch (error) {
      setLoadError(
        isApiError(error)
          ? { status: error.status, message: error.message }
          : { message: 'Falha ao carregar lead' },
      );
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(values: LeadFormValues) {
    if (!canUpdate) return;
    setSaving(true);
    try {
      const updated = await leadsApi.update(id, toUpdateLeadInput(values));
      setLead(updated);
      form.reset(toLeadFormValues(updated));
      void notify.toast('Lead atualizado');
    } catch (error) {
      void notify.toast(isApiError(error) ? error.message : 'Falha ao salvar lead', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <FormSkeleton />;

  if (loadError || !lead) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit" onClick={() => navigate('/leads')}>
          Voltar
        </Button>
        {loadError?.status === 404 ? (
          <ErrorState title="Lead não encontrado" message="Ele pode ter sido removido." />
        ) : (
          <ErrorState
            message={loadError?.message ?? 'Falha ao carregar lead'}
            onRetry={() => void load()}
          />
        )}
      </div>
    );
  }

  const disabled = !canUpdate || saving;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className="w-fit px-0" onClick={() => navigate('/leads')}>
            ← Voltar para leads
          </Button>
          <h1 className="text-2xl font-semibold">{lead.company.name}</h1>
          <p className="text-sm text-muted">
            Campanha:{' '}
            {canReadCampaigns ? (
              <Link to={`/campaigns/${lead.campaign.id}`} className="text-primary hover:underline">
                {lead.campaign.name}
              </Link>
            ) : (
              lead.campaign.name
            )}
          </p>
        </div>
      </div>

      <Card title={canUpdate ? 'Editar lead' : 'Detalhes do lead'}>
        <form className="grid max-w-3xl gap-8" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <LeadFormFields
            form={form}
            disabled={disabled}
            dores={dores}
            googlePlaceId={lead.company.googlePlaceId}
            companyNameFallback={lead.company.name}
          />

          {canUpdate ? (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={saving}>
                Salvar
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => navigate('/leads')}
              >
                Cancelar
              </Button>
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
