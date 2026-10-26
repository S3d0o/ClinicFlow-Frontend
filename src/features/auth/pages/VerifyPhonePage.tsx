import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { maskPhone } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { AuthCard } from '../components/AuthCard';
import { FlowProgress } from '../components/FlowProgress';
import { OtpCodeForm } from '../components/OtpCodeForm';
import { useVerifyPhone } from '../hooks/use-account-access';
import { readState, type VerifyPhoneState } from '../model/flow-state';

/**
 * Sign-up step 2 (FR-ACC-02): the one-time code. Verifying signs the patient in; the route guard then
 * opens the page they were heading to, or their home page.
 */
export default function VerifyPhonePage() {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const navigate = useNavigate();
  const verify = useVerifyPhone();
  const state = readState<VerifyPhoneState>(location.state, 'ticket');
  const [ticket, setTicket] = useState(state?.ticket);

  if (!state || !ticket) return <Navigate to="/sign-up" replace />;

  return (
    <AuthCard
      title={t('verify.title')}
      intro={
        <>
          <Trans t={t} i18nKey="verify.sent" values={{ phone: maskPhone(ticket.phone) }} components={{ phone: <bdi dir="ltr" className="font-semibold text-foreground" /> }} />{' '}
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={() => navigate('/sign-up', { replace: true, state: { from: state.from, draft: state.draft } })}
          >
            {t('verify.editNumber')}
          </Button>
        </>
      }
    >
      <FlowProgress step={2} total={2} label={t('verify.step')} />
      <OtpCodeForm
        ticket={ticket}
        purpose="SignUp"
        submitLabel={t('verify.submit')}
        onSubmit={(code) => verify.mutateAsync({ phone: ticket.phone, code })}
        onTicketChange={setTicket}
      />
    </AuthCard>
  );
}
