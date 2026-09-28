import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginRequestSchema, type LoginRequest } from '@app/shared';
import { brand } from '@/config/brand';
import { useAuth } from '@/stores/auth-context';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { isApiError } from '@/services/api/client';
import { useState } from 'react';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { login: '', password: '' },
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: LoginRequest) {
    setError(null);
    try {
      await login(values.login, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Não foi possível entrar');
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src={brand.logoSrc} alt="" className="h-12 w-12" />
          <h1 className="text-xl font-semibold">{brand.name}</h1>
          <p className="text-sm text-muted">Acesse com seu usuário e senha</p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField label="Login" error={form.formState.errors.login?.message}>
            <Input autoComplete="username" {...form.register('login')} />
          </FormField>
          <FormField label="Senha" error={form.formState.errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...form.register('password')} />
          </FormField>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" loading={form.formState.isSubmitting}>
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
