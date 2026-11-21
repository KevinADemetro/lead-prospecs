import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Globe, Instagram, MapPin, MessageCircle } from 'lucide-react';
import { PERMISSIONS, type PublicLeadDetail } from '@app/shared';
import { leadsApi } from '@/services/api/leads';
import { isApiError } from '@/services/api/client';
import { Drawer } from '@/components/ui/drawer';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { displayUrl, googleMapsLink, toExternalUrl, whatsappLink } from '@/lib/external-url';
import { useAuth } from '@/stores/auth-context';
import { scoreTone } from '../lead-labels';
import { formatCnpj } from '../lead-format';
import { ExternalActionLink, ExternalLink } from './external-link';
import {
  PresenceStatusBadge,
  QualificationBadge,
  ScoreBadge,
  TrelloStatusBadge,
  WebsiteStatusBadge,
  WhatsappStatusBadge,
} from './lead-badges';
import { SendToTrelloButton } from './send-to-trello-button';

type Props = {
  leadId: string | null;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border py-4 first:pt-0 last:border-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'flex flex-col gap-1 sm:col-span-2' : 'flex flex-col gap-1'}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return children === null || children === undefined || children === '' ? (
    <span className="text-muted">Não informado</span>
  ) : (
    <>{children}</>
  );
}

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Carregando">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

function LeadDetails({ lead }: { lead: PublicLeadDetail }) {
  const { hasPermission } = useAuth();
  const { company } = lead;
  const website = toExternalUrl(company.website);
  const instagram = toExternalUrl(company.instagramUrl);
  const facebook = toExternalUrl(company.facebookUrl);
  const maps = googleMapsLink(company);
  const whatsapp = lead.whatsappStatus === 'CONFIRMED' ? whatsappLink(company.phone) : null;
  const trelloCard = toExternalUrl(lead.trelloCardUrl);
  const score = scoreTone(lead.score);

  return (
    <div className="flex flex-col">
      <Section title="Empresa">
        <Field label="Nome">{company.name}</Field>
        <Field label="Razão social">
          <Value>{company.legalName}</Value>
        </Field>
        <Field label="CNPJ">
          <Value>{formatCnpj(company.cnpj)}</Value>
        </Field>
        <Field label="Categoria">
          <Value>{company.category}</Value>
        </Field>
      </Section>

      <Section title="Localização">
        <Field label="Endereço" wide>
          <Value>{company.address}</Value>
        </Field>
        <Field label="Cidade">
          <Value>{company.city}</Value>
        </Field>
        <Field label="Estado">
          <Value>{company.state}</Value>
        </Field>
      </Section>

      <Section title="Contato">
        <Field label="Telefone">
          <Value>{company.phone}</Value>
        </Field>
        <Field label="Email">
          {company.email ? (
            <a href={`mailto:${company.email}`} className="text-primary hover:underline">
              {company.email}
            </a>
          ) : (
            <Value>{null}</Value>
          )}
        </Field>
      </Section>

      <Section title="Presença digital">
        <Field label="Website">
          <div className="flex flex-col items-start gap-1">
            <WebsiteStatusBadge status={lead.websiteStatus} />
            {website ? <ExternalLink href={website}>{displayUrl(website)}</ExternalLink> : null}
          </div>
        </Field>
        <Field label="WhatsApp">
          <div className="flex flex-col items-start gap-1">
            <WhatsappStatusBadge status={lead.whatsappStatus} />
            {whatsapp ? (
              <ExternalLink href={whatsapp} icon={MessageCircle}>
                Abrir conversa
              </ExternalLink>
            ) : null}
          </div>
        </Field>
        <Field label="Instagram">
          <div className="flex flex-col items-start gap-1">
            <PresenceStatusBadge status={lead.instagramStatus} />
            {instagram ? (
              <ExternalLink href={instagram}>{displayUrl(instagram)}</ExternalLink>
            ) : null}
          </div>
        </Field>
        <Field label="Facebook">
          <div className="flex flex-col items-start gap-1">
            <PresenceStatusBadge status={lead.facebookStatus} />
            {facebook ? <ExternalLink href={facebook}>{displayUrl(facebook)}</ExternalLink> : null}
          </div>
        </Field>
        <Field label="Google Maps" wide>
          <ExternalLink href={maps} fallback={<Value>{null}</Value>}>
            Ver no Google Maps
          </ExternalLink>
        </Field>
      </Section>

      <Section title="Qualificação">
        <Field label="Score">
          <span className="inline-flex items-center gap-2">
            <ScoreBadge score={lead.score} />
            <span className="text-xs text-muted">{score.label}</span>
          </span>
        </Field>
        <Field label="Status">
          <QualificationBadge status={lead.qualificationStatus} />
        </Field>
        <Field label="Motivos" wide>
          {lead.scoreReasons.length === 0 ? (
            <span className="text-muted">Nenhum motivo registrado</span>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {lead.scoreReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </Field>
      </Section>

      <Section title="Origem">
        <Field label="Campanha">
          {hasPermission(PERMISSIONS.CAMPAIGNS_READ) ? (
            <Link to={`/campaigns/${lead.campaign.id}`} className="text-primary hover:underline">
              {lead.campaign.name}
            </Link>
          ) : (
            lead.campaign.name
          )}
        </Field>
        <Field label="Data">{new Date(lead.createdAt).toLocaleString()}</Field>
        <Field label="Trello">
          <div className="flex flex-col items-start gap-1">
            <TrelloStatusBadge status={lead.trelloStatus} />
            {trelloCard ? <ExternalLink href={trelloCard}>Abrir card</ExternalLink> : null}
          </div>
        </Field>
      </Section>
    </div>
  );
}

function LeadActions({ lead }: { lead: PublicLeadDetail }) {
  const { company } = lead;
  return (
    <div className="flex flex-wrap gap-2">
      <ExternalActionLink href={googleMapsLink(company)} label="Google Maps" icon={MapPin} />
      <ExternalActionLink href={toExternalUrl(company.website)} label="Website" icon={Globe} />
      <ExternalActionLink
        href={toExternalUrl(company.instagramUrl)}
        label="Instagram"
        icon={Instagram}
      />
      <ExternalActionLink
        href={toExternalUrl(company.facebookUrl)}
        label="Facebook"
        icon={Facebook}
      />
      <SendToTrelloButton />
    </div>
  );
}

export function LeadDetailsDrawer({ leadId, onClose }: Props) {
  const [lead, setLead] = useState<PublicLeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setLead(null);
    try {
      setLead(await leadsApi.get(id));
    } catch (err) {
      setError(
        isApiError(err)
          ? { status: err.status, message: err.message }
          : { message: 'Falha ao carregar lead' },
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (leadId) void load(leadId);
  }, [leadId, load]);

  return (
    <Drawer
      open={Boolean(leadId)}
      title={lead?.company.name ?? 'Detalhes do lead'}
      onClose={onClose}
      footer={lead ? <LeadActions lead={lead} /> : undefined}
    >
      {loading ? (
        <DetailsSkeleton />
      ) : error ? (
        error.status === 404 ? (
          <ErrorState title="Lead não encontrado" message="Ele pode ter sido removido." />
        ) : (
          <ErrorState
            message={error.message}
            onRetry={leadId ? () => void load(leadId) : undefined}
          />
        )
      ) : lead ? (
        <LeadDetails lead={lead} />
      ) : null}
    </Drawer>
  );
}
