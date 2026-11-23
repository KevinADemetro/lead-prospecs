import { cn } from '@/lib/cn';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground shadow-none outline-none ring-ring placeholder:text-muted focus:ring-2',
          className,
        )}
        {...props}
      />
    );
  },
);
