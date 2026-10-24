import { useTranslation } from 'react-i18next';
import { MAIN_CONTENT_ID } from './main-content';

/**
 * "Skip to content" for keyboard users, shown on focus. It moves focus itself because a plain
 * `#main-content` link would be read as a route by the hash router.
 */
export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={(event) => {
        event.preventDefault();
        document.getElementById(MAIN_CONTENT_ID)?.focus();
      }}
      className="sr-only rounded-lg bg-primary px-4 py-2 text-label-md text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60]"
    >
      {t('skipToContent')}
    </a>
  );
}
