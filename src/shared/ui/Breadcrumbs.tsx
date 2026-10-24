import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface Crumb {
  label: string;
  /** Omitted for the current page (the last crumb). */
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = useTranslation('common');
  return (
    <nav aria-label={t('breadcrumb.label')}>
      <ol className="flex flex-wrap items-center gap-1.5 text-body-sm text-muted-foreground">
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && (
              <li aria-hidden="true">
                <ChevronRight className="rtl-flip size-3.5" />
              </li>
            )}
            <li>
              {item.to ? (
                <Link to={item.to} className="hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
