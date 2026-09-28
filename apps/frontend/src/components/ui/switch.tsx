import { cn } from '@/lib/cn';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

export function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cn(
          'h-6 w-11 rounded-full p-0.5 transition',
          checked ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'block h-5 w-5 rounded-full bg-surface transition',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </span>
      {label ? <span className="text-sm text-foreground">{label}</span> : null}
    </button>
  );
}
