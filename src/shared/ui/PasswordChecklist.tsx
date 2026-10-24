import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PASSWORD_RULES } from '@/shared/lib/password';
import { cn } from '@/shared/lib/cn';

/** The password rules, each ticked as the user types (text and icon, never color alone). */
export function PasswordChecklist({ password, id, className }: { password: string; id?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div id={id} className={cn('rounded-lg border border-border bg-muted/50 p-3', className)}>
      <p className="mb-2 text-label-sm uppercase tracking-[0.06em] text-muted-foreground">{t('password.rulesTitle')}</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          const Icon = met ? CheckCircle2 : Circle;
          return (
            <li key={rule.id} className={cn('flex items-center gap-2 text-body-sm', met ? 'text-success' : 'text-muted-foreground')}>
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>
                {t(`password.${rule.id}`)}
                <span className="sr-only">: {met ? t('password.met') : t('password.notMet')}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
