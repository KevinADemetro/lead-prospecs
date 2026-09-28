import { Card } from '@/components/ui/card';
import { useAuth } from '@/stores/auth-context';
import { brand } from '@/config/brand';

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Sessão">
          <p className="text-sm text-muted">Autenticado como</p>
          <p className="mt-1 text-lg font-medium">{user?.login}</p>
        </Card>
        <Card title="Papéis">
          <p className="text-sm text-muted">{user?.roles.map((role) => role.name).join(', ')}</p>
        </Card>
        <Card title="Aplicação">
          <p className="text-sm text-muted">{brand.name}</p>
          <p className="mt-2 text-sm">Base administrativa pronta para novos módulos.</p>
        </Card>
      </div>
    </div>
  );
}
