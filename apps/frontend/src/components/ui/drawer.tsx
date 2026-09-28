import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({ open, title, onClose, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <button className="absolute inset-0" aria-label="Fechar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative z-10 flex h-dvh w-full flex-col bg-surface shadow-xl sm:max-w-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <h2 id="drawer-title" className="truncate text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar detalhes">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer ? (
          <footer className="border-t border-border px-4 py-3 sm:px-6">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
