import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Input } from './input';

/** A password field with a show/hide toggle. Passwords are Latin, so the field stays left-to-right. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} dir="ltr" className={cn('pe-11 text-start', className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('actions.hidePassword') : t('actions.showPassword')}
        aria-pressed={visible}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}
