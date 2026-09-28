import { type ReactNode, useState } from 'react';
import { Button } from './button';

type Props = {
  label: ReactNode;
  children: ReactNode;
};

export function Dropdown({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
        {label}
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 min-w-40 rounded-lg border border-border bg-surface p-1 shadow-lg">
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}
