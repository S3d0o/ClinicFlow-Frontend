import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { OtpTicket } from '@/features/auth/api/auth.service';
import { OtpCodeForm } from '@/features/auth/components/OtpCodeForm';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { isEgyptianMobile } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { useConfirmPhoneChange, useRequestPhoneChange } from '../hooks/use-profile';

/** A new number replaces the old one only after its SMS code is entered (FR-ACC-05). */
export function ChangePhoneDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(['profile', 'common']);
  const errorMessage = useErrorMessage();
  const request = useRequestPhoneChange();
  const confirm = useConfirmPhoneChange();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<OtpTicket | null>(null);

  const sendCode = (event: FormEvent) => {
    event.preventDefault();
    if (!isEgyptianMobile(phone)) return setError(t('common:validation.phone'));
    setError(null);
    request.mutate(phone, { onSuccess: setTicket, onError: (err) => setError(errorMessage(err)) });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contact.changePhone')}</DialogTitle>
          <DialogDescription>{t('contact.changePhoneHint')}</DialogDescription>
        </DialogHeader>
        {ticket ? (
          <OtpCodeForm
            ticket={ticket}
            purpose="ChangePhone"
            submitLabel={t('contact.verify')}
            onTicketChange={setTicket}
            onSubmit={async (code) => {
              await confirm.mutateAsync({ phone: ticket.phone, code });
              toast.success(t('contact.phoneChanged'));
              onClose();
            }}
          />
        ) : (
          <form onSubmit={sendCode} noValidate className="space-y-4">
            <Field label={t('contact.newPhone')} error={error ?? undefined} required>
              {(control) => <PhoneInput {...control} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010 1234 5678" autoFocus />}
            </Field>
            <Button type="submit" className="w-full" disabled={request.isPending}>
              {t('contact.sendCode')}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
