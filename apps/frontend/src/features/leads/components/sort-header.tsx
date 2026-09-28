import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { LeadSortField, SortDirection } from '@app/shared';
import { cn } from '@/lib/cn';

type Props = {
  field: LeadSortField;
  label: string;
  sort?: LeadSortField;
  order: SortDirection;
  onSort: (field: LeadSortField) => void;
};

export function SortHeader({ field, label, sort, order, onSort }: Props) {
  const active = sort === field;
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  const current = active ? (order === 'asc' ? ', crescente' : ', decrescente') : '';
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground',
        active && 'text-foreground',
      )}
      aria-label={`Ordenar por ${label}${current}`}
    >
      {label}
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}
