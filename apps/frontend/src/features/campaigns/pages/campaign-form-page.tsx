import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { createCampaignSchema } from '@app/shared';
import { campaignsApi } from '@/services/api/campaigns';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';

function splitTerms(value: string): string[] {
  return value
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
}

const formSchema = z.object({
  name: createCampaignSchema.shape.name,
  description: z.string().trim().max(500),
  location: createCampaignSchema.shape.location,
  categories: z
    .string()
    .refine((value) => splitTerms(value).length <= 20, 'Informe no máximo 20 categorias'),
  searchTerms: z
    .string()
    .refine((value) => splitTerms(value).length > 0, 'Informe ao menos um termo de busca')
    .refine((value) => splitTerms(value).length <= 20, 'Informe no máximo 20 termos'),
});

type FormValues = z.infer<typeof formSchema>;

export function CampaignFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [editable, setEditable] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', location: '', categories: '', searchTerms: '' },
  });

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const campaign = await campaignsApi.get(id);
        form.reset({
          name: campaign.name,
          description: campaign.description,
          location: campaign.location,
          categories: campaign.categories.join(', '),
          searchTerms: campaign.searchTerms.join(', '),
        });
        setEditable(campaign.status === 'DRAFT');
      } catch (error) {
        await notify.error(
          'Erro',
          isApiError(error) ? error.message : 'Falha ao carregar campanha',
        );
        navigate('/campaigns');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, navigate]);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description,
      location: values.location,
      categories: splitTerms(values.categories),
      searchTerms: splitTerms(values.searchTerms),
    };
    try {
      if (isEdit && id) {
        await campaignsApi.update(id, payload);
        await notify.success('Campanha atualizada');
      } else {
        await campaignsApi.create({ ...payload, filters: {} });
        await notify.success('Campanha criada');
      }
      navigate('/campaigns');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao salvar');
    }
  }

  if (loading) return <Loading />;

  return (
    <Card title={isEdit ? 'Editar campanha' : 'Nova campanha'}>
      <form className="grid max-w-2xl gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {!editable ? (
          <Alert tone="warning">Somente campanhas em rascunho podem ser editadas.</Alert>
        ) : null}
        <FormField label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} disabled={!editable} />
        </FormField>
        <FormField label="Descrição" error={form.formState.errors.description?.message}>
          <Input {...form.register('description')} disabled={!editable} />
        </FormField>
        <FormField
          label="Localização"
          hint="Ex.: São Paulo, SP"
          error={form.formState.errors.location?.message}
        >
          <Input {...form.register('location')} disabled={!editable} />
        </FormField>
        <FormField
          label="Termos de busca"
          hint="Separe por vírgula"
          error={form.formState.errors.searchTerms?.message}
        >
          <Input {...form.register('searchTerms')} disabled={!editable} />
        </FormField>
        <FormField
          label="Categorias"
          hint="Opcional, separe por vírgula"
          error={form.formState.errors.categories?.message}
        >
          <Input {...form.register('categories')} disabled={!editable} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" loading={form.formState.isSubmitting} disabled={!editable}>
            Salvar
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/campaigns')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
