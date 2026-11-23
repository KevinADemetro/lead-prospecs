import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import {
  QUALIFICATION_STATUSES,
  WEBSITE_STATUSES,
  WHATSAPP_STATUSES,
  type LeadFilterOptions,
  type PublicCampaign,
} from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { LeadFilterValues } from '../lead-filters';
import {
  QUALIFICATION_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
  WHATSAPP_STATUS_LABELS,
} from '../lead-labels';

type Props = {
  values: LeadFilterValues;
  options: LeadFilterOptions;
  campaigns: PublicCampaign[] | null;
  onChange: (values: LeadFilterValues) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function LeadFilters({ values, options, campaigns, onChange, onSubmit, onClear }: Props) {
  const set = (key: keyof LeadFilterValues) => (value: string) =>
    onChange({ ...values, [key]: value });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit} role="search">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="Buscar por empresa, razão social, CNPJ, categoria ou cidade"
          aria-label="Buscar leads"
          value={values.search}
          onChange={(event) => set('search')(event.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {campaigns ? (
          <Select
            value={values.campaignId}
            onChange={(event) => set('campaignId')(event.target.value)}
            aria-label="Campanha"
          >
            <option value="">Todas as campanhas</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          value={values.category}
          onChange={(event) => set('category')(event.target.value)}
          aria-label="Categoria"
        >
          <option value="">Todas as categorias</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Select
          value={values.city}
          onChange={(event) => set('city')(event.target.value)}
          aria-label="Cidade"
        >
          <option value="">Todas as cidades</option>
          {options.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Select
          value={values.dorId}
          onChange={(event) => set('dorId')(event.target.value)}
          aria-label="Dor"
        >
          <option value="">Todas as dores</option>
          {options.dores.map((dor) => (
            <option key={dor.id} value={dor.id}>
              {dor.name}
            </option>
          ))}
        </Select>
        <Select
          value={values.qualificationStatus}
          onChange={(event) => set('qualificationStatus')(event.target.value)}
          aria-label="Status"
        >
          <option value="">Todos os status</option>
          {QUALIFICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {QUALIFICATION_STATUS_LABELS[status].label}
            </option>
          ))}
        </Select>
        <Select
          value={values.websiteStatus}
          onChange={(event) => set('websiteStatus')(event.target.value)}
          aria-label="Website"
        >
          <option value="">Website: todos</option>
          {WEBSITE_STATUSES.map((status) => (
            <option key={status} value={status}>
              Website: {WEBSITE_STATUS_LABELS[status].label}
            </option>
          ))}
        </Select>
        <Select
          value={values.whatsappStatus}
          onChange={(event) => set('whatsappStatus')(event.target.value)}
          aria-label="WhatsApp"
        >
          <option value="">WhatsApp: todos</option>
          {WHATSAPP_STATUSES.map((status) => (
            <option key={status} value={status}>
              WhatsApp: {WHATSAPP_STATUS_LABELS[status].label}
            </option>
          ))}
        </Select>
        <Select
          value={values.priority}
          onChange={(event) => set('priority')(event.target.value)}
          aria-label="Prioridade"
        >
          <option value="">Prioridade: todos</option>
          <option value="true">Só prioritários</option>
          <option value="false">Não prioritários</option>
        </Select>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClear}>
          Limpar filtros
        </Button>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </div>
    </form>
  );
}
