import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

const TABS = [
  { to: '/patient/visits', label: 'tabs.visits' },
  { to: '/patient/invoices', label: 'tabs.invoices' },
  { to: '/patient/documents', label: 'tabs.documents' },
] as const;

/** Records' three sections (visits, invoices, documents): one place in the bottom bar, three tabs. */
export function RecordsTabs() {
  const { t } = useTranslation('records');
  return (
    <nav aria-label={t('tabs.label')} className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              'relative shrink-0 px-3 py-3 text-label-md transition-colors',
              isActive ? 'text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {t(tab.label)}
        </NavLink>
      ))}
    </nav>
  );
}
