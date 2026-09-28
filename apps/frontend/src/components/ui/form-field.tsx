import type { ReactNode } from 'react';

type Props = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, error, hint, children }: Props) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint && !error ? <span className="text-muted">{hint}</span> : null}
      {error ? <span className="text-danger">{error}</span> : null}
    </label>
  );
}
