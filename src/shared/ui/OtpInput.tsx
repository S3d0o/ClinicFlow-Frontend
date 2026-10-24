import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once all six digits are entered (typed, pasted or autofilled), to submit right away. */
  onComplete?: (value: string) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
}

const digitsOnly = (text: string) => text.replace(/\D/g, '').slice(0, LENGTH);

/**
 * Six boxes for a one-time code (UX_NOTES U5): numeric keypad, SMS autofill on the first box, paste
 * of the whole code anywhere, and backspace/arrow navigation. Digits always read left to right.
 */
export function OtpInput({ value, onChange, onComplete, id, invalid, disabled, autoFocus, ...aria }: OtpInputProps) {
  const { t } = useTranslation();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');

  const focus = (index: number) => refs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  const update = (next: string) => {
    onChange(next);
    if (next.length === LENGTH) onComplete?.(next);
  };

  const handleInput = (index: number, raw: string) => {
    const typed = digitsOnly(raw);
    if (!typed) return;
    // Autofill and fast typing can deliver several digits into one box
    const next = digitsOnly(value.slice(0, index) + typed + value.slice(index + typed.length));
    update(next);
    focus(index + typed.length);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const target = digits[index] ? index : index - 1;
      if (target < 0) return;
      onChange(value.slice(0, target) + value.slice(target + 1));
      focus(target);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focus(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = digitsOnly(event.clipboardData.getData('text'));
    if (!pasted) return;
    event.preventDefault();
    update(pasted);
    focus(pasted.length);
  };

  return (
    <div id={id} role="group" aria-label={t('otp.label')} dir="ltr" className="flex justify-between gap-2" {...aria}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => handleInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={LENGTH}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={t('otp.digit', { n: index + 1 })}
          aria-invalid={invalid || undefined}
          className={cn(
            'size-12 min-w-0 flex-1 rounded-lg border border-input bg-card text-center font-display text-headline-md text-ink shadow-xs outline-none transition-[border-color,box-shadow] sm:size-14 sm:flex-none',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50',
            invalid && 'border-destructive text-destructive focus-visible:ring-destructive/25'
          )}
        />
      ))}
    </div>
  );
}
