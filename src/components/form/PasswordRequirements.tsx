import { Check, Circle } from 'lucide-react';
import { passwordRules } from '@/lib/password';
import { cn } from '@/lib/utils';

/** Live checklist of the password rules; each rule shows an icon and text, not color alone. */
export function PasswordRequirements({ id, password, requireSpecial = true }: { id: string; password: string; requireSpecial?: boolean }) {
  return (
    <ul id={id} className="grid gap-1 text-xs sm:grid-cols-2">
      {passwordRules(requireSpecial).map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={cn('flex items-center gap-1.5', ok ? 'text-success' : 'text-muted-foreground')}>
            {ok ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3" aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
