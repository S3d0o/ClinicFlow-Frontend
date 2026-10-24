import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { maskPhone } from '@/shared/lib/phone';
import { AuthCard } from '../components/AuthCard';
import { FlowProgress } from '../components/FlowProgress';
import { OtpCodeForm } from '../components/OtpCodeForm';
import { useCheckResetCode } from '../hooks/use-account-access';
import { readState, type ResetCodeState, type ResetWithCodeState } from '../model/flow-state';

/** Password recovery by SMS, step 2: check the code, then choose the new password. */
export default function ResetCodePage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const check = useCheckResetCode();
  const state = readState<ResetCodeState>(location.state, 'ticket');
  const [ticket, setTicket] = useState(state?.ticket);

  if (!ticket) return <Navigate to="/forgot-password" replace />;

  return (
    <AuthCard
      eyebrow={t('verify.resetEyebrow')}
      title={t('verify.resetTitle')}
      intro={
        <>
          <Trans t={t} i18nKey="verify.sent" values={{ phone: maskPhone(ticket.phone) }} components={{ phone: <bdi dir="ltr" className="font-semibold text-foreground" /> }} />{' '}
          <Link to="/forgot-password" replace className="font-semibold text-primary hover:underline">
            {t('verify.editNumber')}
          </Link>
        </>
      }
    >
      <FlowProgress step={2} total={3} label={t('verify.resetTitle')} />
      <OtpCodeForm
        ticket={ticket}
        purpose="PasswordReset"
        submitLabel={t('common:actions.continue')}
        onSubmit={async (code) => {
          await check.mutateAsync({ phone: ticket.phone, code });
          navigate('/reset-password', { replace: true, state: { phone: ticket.phone, code } satisfies ResetWithCodeState });
        }}
        onTicketChange={setTicket}
      />
    </AuthCard>
  );
}
