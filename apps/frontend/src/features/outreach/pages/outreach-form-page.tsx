import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ExternalLink, MessageCircle } from 'lucide-react';
import type {
  OutreachMessageStep,
  OutreachStatus,
  PublicLead,
  PublicOutreach,
} from '@app/shared';
import { OUTREACH_STATUSES, PERMISSIONS } from '@app/shared';
import { outreachApi } from '@/services/api/outreach';
import { leadsApi } from '@/services/api/leads';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading';
import { notify } from '@/lib/swal';
import { useAuth } from '@/stores/auth-context';
import { OutreachStatusBadge } from '../components/outreach-status-badge';
import { OUTREACH_STATUS_LABELS, OUTREACH_STEP_LABELS } from '../outreach-labels';

const FOLLOW_UP_STEPS: Exclude<OutreachMessageStep, 'INITIAL'>[] = [
  'FOLLOW_UP_D3',
  'FOLLOW_UP_D7',
  'FOLLOW_UP_D14',
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function toDateInputValue(iso?: string): string {
  if (!iso) {
    return new Date().toISOString().slice(0, 10);
  }
  return iso.slice(0, 10);
}

export function OutreachFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.OUTREACH_UPDATE);
  const canCreate = hasPermission(PERMISSIONS.OUTREACH_CREATE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outreach, setOutreach] = useState<PublicOutreach | null>(null);
  const [eligibleLeads, setEligibleLeads] = useState<PublicLead[]>([]);

  const [leadId, setLeadId] = useState(searchParams.get('leadId') ?? '');
  const [initialMessage, setInitialMessage] = useState('');
  const [sentAt, setSentAt] = useState(toDateInputValue());
  const [status, setStatus] = useState<OutreachStatus>('WAITING_REPLY');
  const [followUpStep, setFollowUpStep] = useState<Exclude<OutreachMessageStep, 'INITIAL'> | ''>(
    '',
  );
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpSentAt, setFollowUpSentAt] = useState(toDateInputValue());

  useEffect(() => {
    void (async () => {
      try {
        if (id) {
          const detail = await outreachApi.get(id);
          setOutreach(detail);
          setStatus(detail.status);
          setFollowUpSentAt(toDateInputValue());
        } else {
          const result = await leadsApi.list({
            page: 1,
            limit: 100,
            order: 'asc',
            sort: 'companyName',
            qualificationStatus: ['QUALIFIED', 'AUTO_QUALIFIED'],
          });
          setEligibleLeads(result.data.filter((lead) => !lead.outreachId));
        }
      } catch (error) {
        await notify.error(
          'Erro',
          isApiError(error) ? error.message : 'Falha ao carregar abordagem',
        );
        navigate('/outreach');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const nextAvailableStep = useMemo(() => {
    if (!outreach) return null;
    const sent = new Set(outreach.messages.map((message) => message.step));
    return FOLLOW_UP_STEPS.find((step) => !sent.has(step)) ?? null;
  }, [outreach]);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreate) return;
    setSaving(true);
    try {
      const created = await outreachApi.create({
        leadId,
        message: initialMessage.trim(),
        sentAt: new Date(`${sentAt}T00:00:00.000Z`),
        status,
      });
      await notify.success('Abordagem criada');
      navigate(`/outreach/${created.id}`);
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao criar');
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateStatus(event: React.FormEvent) {
    event.preventDefault();
    if (!id || !canUpdate) return;
    setSaving(true);
    try {
      const updated = await outreachApi.update(id, { status });
      setOutreach(updated);
      void notify.toast('Status atualizado');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao atualizar');
    } finally {
      setSaving(false);
    }
  }

  async function onRegisterFollowUp(event: React.FormEvent) {
    event.preventDefault();
    const step = followUpStep || nextAvailableStep;
    if (!id || !canUpdate || !step) return;
    setSaving(true);
    try {
      const updated = await outreachApi.update(id, {
        followUp: {
          step,
          message: followUpMessage.trim(),
          sentAt: new Date(`${followUpSentAt}T00:00:00.000Z`),
        },
      });
      setOutreach(updated);
      setFollowUpStep('');
      setFollowUpMessage('');
      void notify.toast('Follow-up registrado');
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao registrar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  if (!isEdit) {
    return (
      <Card title="Nova abordagem">
        <form className="grid max-w-2xl gap-4" onSubmit={(event) => void onCreate(event)} noValidate>
          <FormField label="Lead" hint="Somente leads qualificados sem abordagem">
            <Select
              required
              value={leadId}
              onChange={(event) => setLeadId(event.target.value)}
            >
              <option value="">Selecione um lead</option>
              {eligibleLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company.name} — {lead.campaign.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Data da primeira mensagem (D0)">
            <Input
              type="date"
              required
              value={sentAt}
              onChange={(event) => setSentAt(event.target.value)}
            />
          </FormField>
          <FormField label="Mensagem inicial">
            <Textarea
              rows={4}
              required
              value={initialMessage}
              onChange={(event) => setInitialMessage(event.target.value)}
              placeholder="Texto enviado no primeiro contato"
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as OutreachStatus)}
            >
              {OUTREACH_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {OUTREACH_STATUS_LABELS[value].label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex gap-2">
            <Button type="submit" loading={saving} disabled={!leadId || !initialMessage.trim()}>
              Criar abordagem
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/outreach')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (!outreach) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" className="mb-2 w-fit px-0" onClick={() => navigate('/outreach')}>
            ← Voltar
          </Button>
          <h1 className="text-2xl font-semibold">{outreach.lead.company.name}</h1>
          <p className="text-sm text-muted">
            Campanha {outreach.lead.campaign.name} · D0 {formatDate(outreach.startedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutreachStatusBadge status={outreach.status} />
          {outreach.whatsappLink ? (
            <a
              href={outreach.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
          <Link to={`/leads/${outreach.leadId}`} className="text-sm text-primary hover:underline">
            Ver lead
          </Link>
        </div>
      </div>

      <Card title="Status">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => void onUpdateStatus(event)}
        >
          <div className="flex-1">
            <FormField label="Status da abordagem">
              <Select
                value={status}
                disabled={!canUpdate}
                onChange={(event) => setStatus(event.target.value as OutreachStatus)}
              >
                {OUTREACH_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {OUTREACH_STATUS_LABELS[value].label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          {canUpdate ? (
            <Button type="submit" loading={saving} variant="secondary">
              Atualizar status
            </Button>
          ) : null}
        </form>
        <p className="mt-2 text-sm text-muted">
          Próximo follow-up:{' '}
          {outreach.nextFollowUpAt ? formatDate(outreach.nextFollowUpAt) : '—'}
          {outreach.status !== 'WAITING_REPLY'
            ? ' (desativado — status diferente de Aguardando resposta)'
            : null}
        </p>
      </Card>

      <Card title="Histórico de mensagens">
        {outreach.messages.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma mensagem registrada.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {outreach.messages.map((message) => (
              <li key={message.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{OUTREACH_STEP_LABELS[message.step]}</span>
                  <span className="text-muted">{formatDate(message.sentAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{message.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canUpdate && nextAvailableStep && outreach.status === 'WAITING_REPLY' ? (
        <Card title={`Registrar ${OUTREACH_STEP_LABELS[nextAvailableStep]}`}>
          <form
            className="grid max-w-2xl gap-4"
            onSubmit={(event) => {
              if (!followUpStep) setFollowUpStep(nextAvailableStep);
              void onRegisterFollowUp(event);
            }}
          >
            <FormField label="Passo">
              <Select value={nextAvailableStep} disabled>
                <option value={nextAvailableStep}>
                  {OUTREACH_STEP_LABELS[nextAvailableStep]}
                </option>
              </Select>
            </FormField>
            <FormField label="Data do envio">
              <Input
                type="date"
                required
                value={followUpSentAt}
                onChange={(event) => setFollowUpSentAt(event.target.value)}
              />
            </FormField>
            <FormField label="Mensagem enviada">
              <Textarea
                rows={4}
                required
                value={followUpMessage}
                onChange={(event) => setFollowUpMessage(event.target.value)}
              />
            </FormField>
            <Button type="submit" loading={saving} disabled={!followUpMessage.trim()}>
              Registrar follow-up
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
