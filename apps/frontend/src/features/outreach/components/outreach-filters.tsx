import { OUTREACH_STATUSES, type OutreachStatus } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { OUTREACH_STATUS_LABELS } from '../outreach-labels';
import type { OutreachFilterValues } from '../outreach-filters';

type Props = {
  values: OutreachFilterValues;
  onChange: (values: OutreachFilterValues) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function OutreachFilters({ values, onChange, onSubmit, onClear }: Props) {
  function toggleStatus(status: OutreachStatus) {
    const next = values.status.includes(status)
      ? values.status.filter((item) => item !== status)
      : [...values.status, status];
    onChange({ ...values, status: next });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por empresa"
          value={values.search}
          onChange={(event) => onChange({ ...values, search: event.target.value })}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
          <Button type="button" variant="ghost" onClick={onClear}>
            Limpar
          </Button>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <Checkbox
          checked={values.followUpToday}
          onChange={(event) =>
            onChange({ ...values, followUpToday: event.target.checked })
          }
        />
        Follow-up de hoje
      </label>

      <div className="flex flex-wrap gap-3">
        {OUTREACH_STATUSES.map((status) => (
          <label key={status} className="inline-flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.status.includes(status)}
              onChange={() => toggleStatus(status)}
            />
            {OUTREACH_STATUS_LABELS[status].label}
          </label>
        ))}
      </div>
    </form>
  );
}
