import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground shadow-none outline-none ring-ring placeholder:text-muted focus:ring-2',
          className,
        )}
        {...props}
      />
    );
  },
);
