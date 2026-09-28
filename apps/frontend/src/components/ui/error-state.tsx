import { EmptyState } from './empty-state';
import { Button } from './button';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Não foi possível carregar os dados',
  message,
  onRetry,
}: Props) {
  return (
    <div role="alert">
      <EmptyState
        title={title}
        description={message}
        action={
          onRetry ? (
            <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null
        }
      />
    </div>
  );
}
