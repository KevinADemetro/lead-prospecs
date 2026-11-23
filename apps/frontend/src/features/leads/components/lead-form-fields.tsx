import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import {
  BRAZILIAN_STATES,
  MANUAL_QUALIFICATION_STATUSES,
  type PublicPainPointSummary,
} from '@app/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { googleMapsLink, resolveWhatsappHref, toExternalUrl, whatsappLink } from '@/lib/external-url';
import { emptyLeadFormValues, type LeadFormValues } from '../lead-form';
import { QUALIFICATION_STATUS_LABELS } from '../lead-labels';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 md:grid-cols-2">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted md:col-span-2">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function OpenExternalLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </a>
  );
}

function FieldWithLinks({
  label,
  error,
  hint,
  links,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  links: Array<{ href: string | null; label: string }>;
  children: ReactNode;
}) {
  const visible = links.filter((link) => link.href);
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">{label}</span>
        {visible.length > 0 ? (
          <span className="flex flex-wrap items-center gap-3">
            {visible.map((link) => (
              <OpenExternalLink key={link.label} href={link.href} label={link.label} />
            ))}
          </span>
        ) : null}
      </div>
      {children}
      {hint && !error ? <span className="text-muted">{hint}</span> : null}
      {error ? <span className="text-danger">{error}</span> : null}
    </div>
  );
}

type Props = {
  form: UseFormReturn<LeadFormValues>;
  disabled: boolean;
  painPoints: PublicPainPointSummary[];
  googlePlaceId?: string | null;
  companyNameFallback?: string;
};

export function LeadFormFields({
  form,
  disabled,
  painPoints,
  googlePlaceId,
  companyNameFallback,
}: Props) {
  const { errors } = form.formState;
  const watched = form.watch('company');
  const company = watched ?? emptyLeadFormValues().company;
  const qualificationStatus = form.watch('qualificationStatus');

  const websiteHref = toExternalUrl(company.website);
  const mapsHref = googleMapsLink({
    name: company.name || companyNameFallback || '',
    address: company.address,
    city: company.city,
    state: company.state,
    googleMapsUrl: company.googleMapsUrl,
    googlePlaceId: googlePlaceId ?? null,
  });
  const instagramHref = toExternalUrl(company.instagramUrl);
  const phoneWhatsappHref = whatsappLink(company.phone);
  const whatsappHref = resolveWhatsappHref(company.whatsappUrl);
  const phoneDigits = company.phone.replace(/\D/g, '');
  const phoneHref =
    phoneDigits.length >= 8
      ? `tel:+${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}`
      : null;

  return (
    <>
      <Section title="Qualificação">
        <FormField
          label="Lead qualificado?"
          error={errors.qualificationStatus?.message}
          hint={
            qualificationStatus === 'AUTO_QUALIFIED'
              ? 'Definido automaticamente — altere só se quiser sobrescrever'
              : 'Marque se o lead está pronto para abordagem'
          }
        >
          <Select
            disabled={disabled}
            aria-label="Status de qualificação"
            {...form.register('qualificationStatus')}
          >
            {MANUAL_QUALIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {QUALIFICATION_STATUS_LABELS[status].label}
              </option>
            ))}
            {/* Shown only when already set (system/bulk); never offered as a new choice. */}
            {qualificationStatus === 'AUTO_QUALIFIED' ? (
              <option value="AUTO_QUALIFIED">
                {QUALIFICATION_STATUS_LABELS.AUTO_QUALIFIED.label}
              </option>
            ) : null}
          </Select>
        </FormField>
        <FormField
          label="Dor"
          error={errors.painPointId?.message}
          hint="Problema ou necessidade do cliente"
        >
          <Select
            disabled={disabled}
            aria-label="Dor do lead"
            {...form.register('painPointId')}
          >
            <option value="">Sem dor</option>
            {painPoints.map((painPoint) => (
              <option key={painPoint.id} value={painPoint.id}>
                {painPoint.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Prioritário"
          error={errors.priority?.message}
          hint="Marque leads com alto potencial"
        >
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={disabled}
              aria-label="Lead prioritário"
              checked={form.watch('priority')}
              onChange={(event) =>
                form.setValue('priority', event.target.checked, { shouldValidate: true })
              }
            />
            Alto potencial
          </label>
        </FormField>
        <div className="md:col-span-2">
          <FormField
            label="Observação"
            error={errors.notes?.message}
            hint="Anotações livres sobre o lead"
          >
            <Textarea
              disabled={disabled}
              aria-label="Observação do lead"
              rows={3}
              {...form.register('notes')}
            />
          </FormField>
        </div>
      </Section>

      <Section title="Presença digital">
        <FieldWithLinks
          label="Website"
          error={errors.company?.website?.message}
          links={[{ href: websiteHref, label: 'Abrir site' }]}
        >
          <Input disabled={disabled} {...form.register('company.website')} />
        </FieldWithLinks>
        <FieldWithLinks
          label="Google Maps URL"
          error={errors.company?.googleMapsUrl?.message}
          links={[{ href: mapsHref, label: 'Abrir no Maps' }]}
        >
          <Input disabled={disabled} {...form.register('company.googleMapsUrl')} />
        </FieldWithLinks>
        <FieldWithLinks
          label="WhatsApp"
          error={errors.company?.whatsappUrl?.message}
          hint="Link real do WhatsApp (Instagram, site, etc.) — pode diferir do telefone do Google"
          links={[{ href: whatsappHref, label: 'Abrir WhatsApp' }]}
        >
          <Input
            disabled={disabled}
            placeholder="https://wa.me/5511999999999"
            {...form.register('company.whatsappUrl')}
          />
        </FieldWithLinks>
        <FieldWithLinks
          label="Instagram"
          error={errors.company?.instagramUrl?.message}
          links={[{ href: instagramHref, label: 'Abrir Instagram' }]}
        >
          <Input disabled={disabled} {...form.register('company.instagramUrl')} />
        </FieldWithLinks>
        {googlePlaceId ? (
          <FormField label="Google Place ID" hint="Somente leitura">
            <Input disabled value={googlePlaceId} readOnly />
          </FormField>
        ) : null}
      </Section>

      <Section title="Empresa (dados do Google)">
        <FormField label="Nome" error={errors.company?.name?.message}>
          <Input disabled={disabled} {...form.register('company.name')} />
        </FormField>
        <FormField label="Categoria" error={errors.company?.category?.message}>
          <Input disabled={disabled} {...form.register('company.category')} />
        </FormField>
        <FormField label="Nicho" error={errors.company?.niche?.message}>
          <Input disabled={disabled} {...form.register('company.niche')} />
        </FormField>
        <FieldWithLinks
          label="Telefone"
          error={errors.company?.phone?.message}
          links={[
            { href: phoneHref, label: 'Ligar' },
            { href: phoneWhatsappHref, label: 'Testar WhatsApp' },
          ]}
        >
          <Input disabled={disabled} {...form.register('company.phone')} />
        </FieldWithLinks>
      </Section>

      <Section title="Localização">
        <div className="md:col-span-2">
          <FormField label="Endereço" error={errors.company?.address?.message}>
            <Input disabled={disabled} {...form.register('company.address')} />
          </FormField>
        </div>
        <FormField label="Bairro" error={errors.company?.neighborhood?.message}>
          <Input disabled={disabled} {...form.register('company.neighborhood')} />
        </FormField>
        <FormField label="Cidade" error={errors.company?.city?.message}>
          <Input disabled={disabled} {...form.register('company.city')} />
        </FormField>
        <FormField label="Estado" error={errors.company?.state?.message}>
          <Select disabled={disabled} {...form.register('company.state')}>
            <option value="">—</option>
            {BRAZILIAN_STATES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="País" error={errors.company?.country?.message}>
          <Input disabled={disabled} {...form.register('company.country')} />
        </FormField>
      </Section>
    </>
  );
}
