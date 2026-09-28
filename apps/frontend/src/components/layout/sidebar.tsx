import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navigation } from '@/config/navigation';
import { brand } from '@/config/brand';
import { useAuth } from '@/stores/auth-context';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: Props) {
  const { hasPermission } = useAuth();
  const items = navigation.filter((item) => hasPermission(item.permission));

  return (
    <>
      {mobileOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Fechar menu"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all md:static',
          collapsed ? 'md:w-20' : 'md:w-64',
          mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 w-72 md:w-auto',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={brand.logoSrc} alt="" className="h-8 w-8 rounded-md" />
            {!collapsed ? <span className="truncate font-semibold">{brand.name}</span> : null}
          </div>
          <Button variant="ghost" size="sm" className="text-sidebar-foreground md:hidden" onClick={onCloseMobile}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10',
                    isActive ? 'bg-white/15 font-medium' : '',
                    collapsed ? 'md:justify-center md:px-2' : '',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(collapsed ? 'md:hidden' : '')}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
