import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, createRoleSchema, type CreateRoleInput } from '@app/shared';
import { rolesApi } from '@/services/api/roles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loading } from '@/components/ui/loading';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';

export function RoleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '', permissions: [] },
  });

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const role = await rolesApi.get(id);
      form.reset({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
      setLoading(false);
    })();
  }, [id, form]);

  async function onSubmit(values: CreateRoleInput) {
    try {
      if (isEdit && id) {
        await rolesApi.update(id, values);
        await notify.success('Papel atualizado');
      } else {
        await rolesApi.create(values);
        await notify.success('Papel criado');
      }
      navigate('/roles');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao salvar');
    }
  }

  if (loading) return <Loading />;
  const selected = form.watch('permissions');

  return (
    <Card title={isEdit ? 'Editar papel' : 'Novo papel'}>
      <form className="grid max-w-2xl gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </FormField>
        <FormField label="Descrição" error={form.formState.errors.description?.message}>
          <Input {...form.register('description')} />
        </FormField>
        <FormField label="Permissões" error={form.formState.errors.permissions?.message}>
          <div className="grid gap-4 sm:grid-cols-2">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.resource} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-sm font-medium capitalize">{group.resource}</p>
                {group.actions.map((permission) => (
                  <label key={permission} className="mb-2 flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected.includes(permission)}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...selected, permission]
                          : selected.filter((value) => value !== permission);
                        form.setValue('permissions', next, { shouldValidate: true });
                      }}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </FormField>
        <p className="text-xs text-muted">{ALL_PERMISSIONS.length} permissões no catálogo.</p>
        <div className="flex gap-2">
          <Button type="submit" loading={form.formState.isSubmitting}>
            Salvar
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/roles')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
