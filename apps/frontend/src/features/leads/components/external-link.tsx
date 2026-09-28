import type { ReactNode } from 'react';
import { ExternalLink as ExternalLinkIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  href: string | null;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
  /** Rendered when `href` is missing or unsafe. */
  fallback?: ReactNode;
};

/** Always opens in a new tab without leaking the opener or referrer. */
export function ExternalLink({
  href,
  children,
  icon: Icon = ExternalLinkIcon,
  className,
  fallback,
}: Props) {
  if (!href) return <>{fallback ?? <span className="text-muted">—</span>}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex max-w-full items-center gap-1 text-primary hover:underline',
        className,
      )}
    >
      <span className="truncate">{children}</span>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
    </a>
  );
}

type ActionProps = {
  href: string | null;
  label: string;
  icon: LucideIcon;
};

/** Button-styled external link; rendered disabled when there is no safe URL. */
export function ExternalActionLink({ href, label, icon: Icon }: ActionProps) {
  const base =
    'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition';
  if (!href) {
    return (
      <span
        className={cn(base, 'cursor-not-allowed text-muted opacity-50')}
        aria-disabled="true"
        title="Link não disponível"
      >
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        base,
        'bg-surface text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </a>
  );
}
