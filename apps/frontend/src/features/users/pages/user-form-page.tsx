import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { createUserSchema, passwordSchema, type PublicRole } from '@app/shared';
import { usersApi } from '@/services/api/users';
import { rolesApi } from '@/services/api/roles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loading } from '@/components/ui/loading';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';

const formSchema = createUserSchema
  .extend({
    password: passwordSchema.or(z.literal('')),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [roles, setRoles] = useState<PublicRole[]>([]);
  const [loading, setLoading] = useState(isEdit);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      isEdit
        ? formSchema
        : createUserSchema
            .extend({ confirmPassword: z.string() })
            .refine((value) => value.password === value.confirmPassword, {
              message: 'As senhas não conferem',
              path: ['confirmPassword'],
            }),
    ),
    defaultValues: {
      login: '',
      password: '',
      confirmPassword: '',
      roleIds: [],
      status: 'active',
    },
  });

  useEffect(() => {
    void (async () => {
      const listed = await rolesApi.list({ page: 1, limit: 100, order: 'asc' });
      setRoles(listed.data);
      if (id) {
        const user = await usersApi.get(id);
        form.reset({
          login: user.login,
          password: '',
          confirmPassword: '',
          roleIds: user.roles.map((role) => role.id),
          status: user.status,
        });
      }
      setLoading(false);
    })();
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && id) {
        await usersApi.update(id, {
          login: values.login,
          status: values.status,
          roleIds: values.roleIds,
          ...(values.password ? { password: values.password } : {}),
        });
        await notify.success('Usuário atualizado');
      } else {
        await usersApi.create({
          login: values.login,
          password: values.password,
          roleIds: values.roleIds,
          status: values.status,
        });
        await notify.success('Usuário criado');
      }
      navigate('/users');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao salvar');
    }
  }

  if (loading) return <Loading />;

  const selected = form.watch('roleIds');

  return (
    <Card title={isEdit ? 'Editar usuário' : 'Novo usuário'}>
      <form className="grid max-w-xl gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField label="Login" error={form.formState.errors.login?.message}>
          <Input autoComplete="off" {...form.register('login')} />
        </FormField>
        <FormField
          label={isEdit ? 'Nova senha (opcional)' : 'Senha'}
          error={form.formState.errors.password?.message}
        >
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
        </FormField>
        <FormField label="Status" error={form.formState.errors.status?.message}>
          <Select {...form.register('status')}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </Select>
        </FormField>
        <FormField label="Papéis" error={form.formState.errors.roleIds?.message}>
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(role.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selected, role.id]
                      : selected.filter((value) => value !== role.id);
                    form.setValue('roleIds', next, { shouldValidate: true });
                  }}
                />
                {role.name}
              </label>
            ))}
          </div>
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" loading={form.formState.isSubmitting}>
            Salvar
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
