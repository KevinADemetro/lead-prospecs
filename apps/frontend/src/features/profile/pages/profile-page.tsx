import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordSchema } from '@app/shared';
import { authApi } from '@/services/api/auth';
import { useAuth } from '@/stores/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';
import { useNavigate } from 'react-router-dom';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      await notify.success('Senha alterada', 'Faça login novamente.');
      await logout();
      navigate('/login');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao alterar senha');
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Perfil">
        <p className="text-sm text-muted">Login</p>
        <p className="mb-4 text-lg font-medium">{user?.login}</p>
        <p className="text-sm text-muted">Papéis</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {user?.roles.map((role) => (
            <Badge key={role.id} tone="info">
              {role.name}
            </Badge>
          ))}
        </div>
      </Card>
      <Card title="Alterar senha">
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField label="Senha atual" error={form.formState.errors.currentPassword?.message}>
            <Input type="password" {...form.register('currentPassword')} />
          </FormField>
          <FormField label="Nova senha" error={form.formState.errors.newPassword?.message}>
            <Input type="password" {...form.register('newPassword')} />
          </FormField>
          <FormField label="Confirmar nova senha" error={form.formState.errors.confirmPassword?.message}>
            <Input type="password" {...form.register('confirmPassword')} />
          </FormField>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Atualizar senha
          </Button>
        </form>
      </Card>
    </div>
  );
}
