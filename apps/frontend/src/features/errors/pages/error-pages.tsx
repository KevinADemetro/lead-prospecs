import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">403</h1>
        <p className="mt-2 text-muted">Você não tem permissão para acessar este recurso.</p>
        <Link to="/dashboard">
          <Button className="mt-4">Voltar ao dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="mt-2 text-muted">Página não encontrada.</p>
        <Link to="/dashboard">
          <Button className="mt-4">Ir para o início</Button>
        </Link>
      </Card>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">500</h1>
        <p className="mt-2 text-muted">Ocorreu um erro interno. Tente novamente mais tarde.</p>
        <Link to="/dashboard">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </Card>
    </div>
  );
}
