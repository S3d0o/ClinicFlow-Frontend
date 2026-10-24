import { useTranslation } from 'react-i18next';
import { DemoAccountsPanel } from '../components/DemoAccountsPanel';

/**
 * Temporary sign-in until phase 1 builds the designed screen (which keeps this list as a demo panel).
 * Once a user is signed in, the route guard sends them on to where they were going.
 */
export default function DemoSignInPage() {
  const { t } = useTranslation('screens');
  return (
    <div className="space-y-6">
      <h1 className="font-display text-headline-lg text-ink">{t('signIn')}</h1>
      <DemoAccountsPanel />
    </div>
  );
}
