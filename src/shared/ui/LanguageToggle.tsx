import { useTranslation } from 'react-i18next';
import { LANGUAGES, nativeNameOf } from '@/shared/i18n/languages';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';

/** "EN | عربي" switch. Both options stay visible so users can find their language at a glance. */
export function LanguageToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cn('inline-flex items-center rounded-full border border-border bg-card p-0.5 text-label-md', className)}
    >
      {LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
          className={cn(
            'min-h-8 rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            language === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {nativeNameOf(option)}
        </button>
      ))}
    </div>
  );
}
