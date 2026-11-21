import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { BRAZILIAN_STATES, type PublicCampaign } from '@app/shared';
import { campaignsApi } from '@/services/api/campaigns';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';
import { CAMPAIGN_BOOLEAN_FILTERS, CAMPAIGN_RULES } from '../campaign-labels';
import {
  campaignFormSchema,
  emptyCampaignFormValues,
  isBrazilianState,
  splitTerms,
  toCampaignFilters,
  toCampaignFormValues,
  type CampaignFormValues,
} from '../campaign-form';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function FormSkeleton() {
  return (
    <Card>
      <div className="grid max-w-2xl gap-4" role="status" aria-label="Carregando">
        <Skeleton className="h-7 w-48" />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function CampaignFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const editable = !campaign || CAMPAIGN_RULES.canEdit(campaign.status);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: emptyCampaignFormValues,
  });
  const { errors } = form.formState;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const current = await campaignsApi.get(id);
      setCampaign(current);
      form.reset(toCampaignFormValues(current));
    } catch (error) {
      setLoadError(isApiError(error) ? error.message : 'Falha ao carregar campanha');
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(values: CampaignFormValues) {
    if (!isBrazilianState(values.state)) return;
    const payload = {
      name: values.name,
      description: values.description,
      city: values.city,
      state: values.state,
      categories: splitTerms(values.categories),
      searchTerms: splitTerms(values.searchTerms),
      filters: toCampaignFilters(values.filters, campaign?.filters),
    };
    try {
      const saved =
        isEdit && id ? await campaignsApi.update(id, payload) : await campaignsApi.create(payload);
      void notify.toast(isEdit ? 'Campanha atualizada' : 'Campanha criada');
      navigate(`/campaigns/${saved.id}`);
    } catch (error) {
      void notify.toast(isApiError(error) ? error.message : 'Falha ao salvar campanha', 'error');
    }
  }

  if (loading) return <FormSkeleton />;

  if (loadError) {
    return (
      <Card>
        <ErrorState message={loadError} onRetry={() => void load()} />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => navigate('/campaigns')}>
            Voltar para campanhas
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={isEdit ? 'Editar campanha' : 'Nova campanha'}>
      <form className="grid max-w-2xl gap-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {!editable ? (
          <Alert tone="warning">Somente campanhas em rascunho podem ser editadas.</Alert>
        ) : null}
        <fieldset disabled={!editable} className="grid gap-6">
          <Section title="Dados gerais">
            <FormField label="Nome" error={errors.name?.message}>
              <Input {...form.register('name')} />
            </FormField>
            <FormField label="Descrição" hint="Opcional" error={errors.description?.message}>
              <Input {...form.register('description')} />
            </FormField>
          </Section>

          <Section title="Localização">
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <FormField label="Cidade" error={errors.city?.message}>
                <Input {...form.register('city')} placeholder="Ex.: São Paulo" />
              </FormField>
              <FormField label="Estado" error={errors.state?.message}>
                <Select {...form.register('state')}>
                  <option value="">UF</option>
                  {BRAZILIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </Section>

          <Section title="Busca">
            <FormField
              label="Categorias"
              hint="Opcional, separe por vírgula"
              error={errors.categories?.message}
            >
              <Input {...form.register('categories')} placeholder="Ex.: padaria, confeitaria" />
            </FormField>
            <FormField
              label="Termos de busca"
              hint="Separe por vírgula"
              error={errors.searchTerms?.message}
            >
              <Input {...form.register('searchTerms')} placeholder="Ex.: padaria artesanal" />
            </FormField>
          </Section>

          <Section title="Filtros">
            <div className="grid gap-3 sm:grid-cols-2">
              {CAMPAIGN_BOOLEAN_FILTERS.map(({ key, label }) => (
                <label key={key} className="flex min-h-11 items-center gap-3 text-sm">
                  <Checkbox {...form.register(`filters.${key}`)} />
                  {label}
                </label>
              ))}
            </div>
          </Section>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={form.formState.isSubmitting} disabled={!editable}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(id ? `/campaigns/${id}` : '/campaigns')}
          >
            Voltar
          </Button>
        </div>
      </form>
    </Card>
  );
}
