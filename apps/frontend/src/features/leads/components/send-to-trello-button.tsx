import { useId } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  count?: number;
  size?: 'sm' | 'md';
};

/** Visual placeholder: the Trello integration is delivered in a later stage. */
export function SendToTrelloButton({ count, size = 'sm' }: Props) {
  const hintId = useId();
  return (
    <Button
      variant="secondary"
      size={size}
      disabled
      title="Integração com o Trello disponível em breve"
      aria-describedby={hintId}
    >
      <Send className="h-4 w-4" aria-hidden />
      Enviar para Trello{count ? ` (${count})` : ''}
      <span
        id={hintId}
        className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-info"
      >
        Em breve
      </span>
    </Button>
  );
}
