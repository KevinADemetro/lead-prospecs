import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PERMISSIONS, type PublicCampaign } from '@app/shared';
import { campaignsApi } from '@/services/api/campaigns';
import { isApiError } from '@/services/api/client';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/swal';
import { useAuth } from '@/stores/auth-context';
import { CAMPAIGN_RULES } from '../campaign-labels';

type Action = 'run' | 'cancel' | 'delete';

type Props = {
  campaign: PublicCampaign;
  onChanged: () => void;
  onDeleted?: () => void;
  showView?: boolean;
};

const ACTIONS: Record<
  Action,
  {
    confirm: (name: string) => [string, string];
    execute: (id: string) => Promise<unknown>;
    success: string;
    failure: string;
  }
> = {
  run: {
    confirm: (name) => [
      `Executar campanha ${name}?`,
      'Será feita a busca de empresas no Google Places para as categorias e localização informadas.',
    ],
    execute: campaignsApi.run,
    success: 'Campanha executada',
    failure: 'Falha ao executar campanha',
  },
  cancel: {
    confirm: (name) => [
      `Cancelar campanha ${name}?`,
      'Campanhas canceladas não podem ser editadas.',
    ],
    execute: campaignsApi.cancel,
    success: 'Campanha cancelada',
    failure: 'Falha ao cancelar campanha',
  },
  delete: {
    confirm: (name) => [`Excluir campanha ${name}?`, 'Esta ação não pode ser desfeita.'],
    execute: campaignsApi.remove,
    success: 'Campanha excluída',
    failure: 'Falha ao excluir campanha',
  },
};

export function CampaignActions({ campaign, onChanged, onDeleted, showView = true }: Props) {
  const { hasPermission } = useAuth();
  const [pending, setPending] = useState<Action | null>(null);
  const canUpdate = hasPermission(PERMISSIONS.CAMPAIGNS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.CAMPAIGNS_DELETE);

  async function perform(action: Action) {
    const config = ACTIONS[action];
    const confirmed = await notify.confirm(...config.confirm(campaign.name));
    if (!confirmed) return;
    setPending(action);
    try {
      await config.execute(campaign.id);
      void notify.toast(config.success);
      if (action === 'delete' && onDeleted) onDeleted();
      else onChanged();
    } catch (error) {
      void notify.toast(isApiError(error) ? error.message : config.failure, 'error');
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {showView ? (
        <Link to={`/campaigns/${campaign.id}`}>
          <Button size="sm" variant="secondary">
            Visualizar
          </Button>
        </Link>
      ) : null}
      {canUpdate && CAMPAIGN_RULES.canEdit(campaign.status) ? (
        <Link to={`/campaigns/${campaign.id}/edit`}>
          <Button size="sm" variant="secondary">
            Editar
          </Button>
        </Link>
      ) : null}
      {canUpdate && CAMPAIGN_RULES.canRun(campaign.status) ? (
        <Button
          size="sm"
          loading={pending === 'run'}
          disabled={busy}
          onClick={() => void perform('run')}
        >
          Executar
        </Button>
      ) : null}
      {canUpdate && CAMPAIGN_RULES.canCancel(campaign.status) ? (
        <Button
          size="sm"
          variant="ghost"
          loading={pending === 'cancel'}
          disabled={busy}
          onClick={() => void perform('cancel')}
        >
          Cancelar
        </Button>
      ) : null}
      {canDelete && CAMPAIGN_RULES.canDelete(campaign.status) ? (
        <Button
          size="sm"
          variant="danger"
          loading={pending === 'delete'}
          disabled={busy}
          onClick={() => void perform('delete')}
        >
          Excluir
        </Button>
      ) : null}
    </div>
  );
}
