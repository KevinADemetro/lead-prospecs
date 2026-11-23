import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { createPainPointSchema, type CreatePainPointInput } from '@app/shared';
import { painPointsApi } from '@/services/api/pain-points';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';

export function PainPointFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const form = useForm<CreatePainPointInput>({
    resolver: zodResolver(createPainPointSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const painPoint = await painPointsApi.get(id);
        form.reset({
          name: painPoint.name,
          description: painPoint.description,
        });
      } catch (error) {
        await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao carregar dor');
        navigate('/pain-points');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, navigate]);

  async function onSubmit(values: CreatePainPointInput) {
    try {
      if (isEdit && id) {
        await painPointsApi.update(id, values);
        await notify.success('Dor atualizada');
      } else {
        await painPointsApi.create(values);
        await notify.success('Dor criada');
      }
      navigate('/pain-points');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao salvar');
    }
  }

  if (loading) return <Loading />;

  return (
    <Card title={isEdit ? 'Editar dor' : 'Nova dor'}>
      <form className="grid max-w-2xl gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField label="Nome" error={form.formState.errors.name?.message}>
          <Input placeholder="Ex.: Baixa conversão" {...form.register('name')} />
        </FormField>
        <FormField
          label="Descrição"
          error={form.formState.errors.description?.message}
          hint="Opcional — contexto para quem for selecionar no lead"
        >
          <Textarea rows={3} {...form.register('description')} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" loading={form.formState.isSubmitting}>
            Salvar
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/pain-points')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
