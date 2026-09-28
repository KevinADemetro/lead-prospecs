import type { ComponentProps, ReactNode } from 'react';
import { Button } from './button';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function EmptyStateAction(props: ComponentProps<typeof Button>) {
  return <Button {...props} />;
}
