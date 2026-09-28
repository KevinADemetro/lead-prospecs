import { LogOut, Menu, Moon, PanelLeft, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth-context';
import { useTheme } from '@/stores/theme-context';
import { notify } from '@/lib/swal';

type Props = {
  onMenu: () => void;
  onCollapse: () => void;
};

export function Header({ onMenu, onCollapse }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  async function onLogout() {
    const confirmed = await notify.confirm('Sair do sistema?', 'A sessão atual será encerrada.');
    if (!confirmed) return;
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-3 md:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onMenu} aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onCollapse} aria-label="Recolher menu">
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[140px] truncate text-sm text-muted sm:block">{user?.login}</span>
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="Alternar tema">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void onLogout()}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
