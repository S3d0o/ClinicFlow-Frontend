import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { NavGroup } from '@/app/navigation';
import { cn } from '@/shared/lib/cn';

/** The staff menu: one labelled group per workspace the user has permissions for. */
export function StaffNavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const { t } = useTranslation('nav');

  return (
    <nav aria-label={t('groups.account')} className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="eyebrow px-3">{t(`groups.${group.label}`)}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  // Workspace home links match exactly; others also match their detail pages
                  end={item.to.split('/').length === 2}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-label-md transition-colors',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-active-foreground before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-full before:bg-primary'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <item.icon aria-hidden="true" className="size-[18px] shrink-0" />
                  {t(`items.${item.label}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
