import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

/** Copies `text` to the clipboard and says so for two seconds. */
export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context): the text stays visible to copy by hand
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? t('actions.copied') : (label ?? t('actions.copy'))}</span>
    </Button>
  );
}
