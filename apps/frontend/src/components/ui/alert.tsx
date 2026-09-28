import { cn } from '@/lib/cn';

type Props = {
  tone?: 'success' | 'danger' | 'info' | 'warning';
  children: string;
};

const tones = {
  success: 'border-success/30 bg-success/10 text-success',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-info/30 bg-info/10 text-info',
  warning: 'border-warning/30 bg-warning/10 text-warning',
};

export function Alert({ tone = 'info', children }: Props) {
  return (
    <div className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone])} role="alert">
      {children}
    </div>
  );
}
