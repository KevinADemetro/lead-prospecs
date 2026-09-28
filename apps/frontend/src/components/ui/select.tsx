import { cn } from '@/lib/cn';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none ring-ring focus:ring-2',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
