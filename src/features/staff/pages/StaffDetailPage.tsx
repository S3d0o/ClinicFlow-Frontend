import { useState } from 'react';
import { Building2, IdCard, Mail, Phone, RefreshCw, ShieldAlert, ShieldCheck, ShieldOff, UserX, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatInstant } from '@/shared/lib/intl';
import { Avatar } from '@/shared/ui/Avatar';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { DeactivatePanel } from '../components/DeactivatePanel';
import { EditRolesDialog } from '../components/EditRolesDialog';
import { RoleChips, StaffStatusChip } from '../components/StaffBits';
import { useBranchCoverageLabel } from '../hooks/use-branch-coverage';
import { useResendInvitation, useResetMfa, useRevokeInvitation, useStaffMember } from '../hooks/use-staff';

const CLINIC_ZONE = 'Africa/Cairo';

/** A staff member: contact, roles and branches, sign-in security, and ending their access (FR-STF-03, 04, 07; design admin/03). */
export default function StaffDetailPage() {
  const { staffId = '' } = useParams();
  const { t } = useTranslation(['staff', 'screens', 'common']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useSession();
  const errorMessage = useErrorMessage();
  const coverageLabel = useBranchCoverageLabel();
  const member = useStaffMember(staffId);
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();
  const resetMfa = useResetMfa();
  const [editing, setEditing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  if (member.isPending) return <LoadingState />;
  if (member.isError) return <ErrorState onRetry={() => void member.refetch()} />;

  const m = member.data;
  const self = m.id === user?.id;
  const invited = m.status === 'Invited';
  const ended = m.status === 'Deactivated';
  const date = (iso: string) => formatInstant(iso, language, CLINIC_ZONE, { day: 'numeric', month: 'long', year: 'numeric' });
  const actionError = resend.error ?? revoke.error ?? resetMfa.error;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t('screens:staff'), to: '/admin/staff' }, { label: m.fullName }]} />

      <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <Avatar name={m.fullName} size="lg" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-headline-lg text-ink">
                  <bdi>{m.fullName}</bdi>
                </h1>
                <StaffStatusChip status={m.status} />
              </div>
              <RoleChips roles={m.roles} />
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-muted-foreground">
                {m.email && (
                  <li className="flex items-center gap-1.5">
                    <Mail aria-hidden="true" className="size-4" />
                    <span dir="ltr">{m.email}</span>
                  </li>
                )}
                {m.phone && (
                  <li className="flex items-center gap-1.5">
                    <Phone aria-hidden="true" className="size-4" />
                    <span dir="ltr">{m.phone}</span>
                  </li>
                )}
                <li className="flex items-center gap-1.5">
                  <Building2 aria-hidden="true" className="size-4" />
                  {coverageLabel(m.roles)}
                </li>
                {m.licenseNo && (
                  <li className="flex items-center gap-1.5">
                    <IdCard aria-hidden="true" className="size-4" />
                    {t('detail.license', { number: m.licenseNo })}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {!self && (
            <div className="flex flex-wrap gap-2">
              {invited && can(user, 'staff.invite') && (
                <>
                  <Button variant="outline" disabled={resend.isPending} onClick={() => resend.mutate(m.id, { onSuccess: () => toast.success(t('invitation.resent', { email: m.email })) })}>
                    <RefreshCw aria-hidden="true" />
                    {t('invitation.resend')}
                  </Button>
                  <Button
                    variant="destructive-outline"
                    disabled={revoke.isPending}
                    onClick={() =>
                      revoke.mutate(m.id, {
                        onSuccess: () => {
                          toast.success(t('invitation.revoked'));
                          navigate('/admin/staff');
                        },
                      })
                    }
                  >
                    <XCircle aria-hidden="true" />
                    {t('invitation.revoke')}
                  </Button>
                </>
              )}
              {!invited && !ended && can(user, 'staff.deactivate') && (
                <>
                  {m.mfaEnrolled && (
                    <Button variant="outline" disabled={resetMfa.isPending} onClick={() => resetMfa.mutate(m.id, { onSuccess: () => toast.success(t('detail.mfaResetDone')) })}>
                      <ShieldOff aria-hidden="true" />
                      {t('detail.resetMfa')}
                    </Button>
                  )}
                  {m.status === 'Active' && (
                    <Button variant="destructive-outline" onClick={() => setDeactivating(true)}>
                      <UserX aria-hidden="true" />
                      {t('deactivate.open')}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {invited ? (
            m.invitationExpiresAt && <StatusChip tone="info">{t('invitation.expires', { date: date(m.invitationExpiresAt) })}</StatusChip>
          ) : m.mfaEnrolled ? (
            <StatusChip tone="success">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              {t('detail.mfaOn')}
            </StatusChip>
          ) : (
            <StatusChip tone="warning">
              <ShieldAlert aria-hidden="true" className="size-3.5" />
              {t('detail.mfaMissing')}
            </StatusChip>
          )}
          {m.accessEndsAt && (
            <StatusChip tone={ended ? 'neutral' : 'warning'}>
              {t(ended ? 'detail.endedOn' : 'detail.endsOn', { date: date(m.accessEndsAt) })}
            </StatusChip>
          )}
        </div>
      </section>

      {actionError && <FormAlert>{errorMessage(actionError)}</FormAlert>}
      {deactivating && <DeactivatePanel member={m} onDone={() => setDeactivating(false)} />}

      <section aria-labelledby="roles-title" className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 id="roles-title" className="font-display text-headline-md text-ink">
            {t('roles.title')}
          </h2>
          {!self && !ended && can(user, 'staff.invite') && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {t('common:actions.edit')}
            </Button>
          )}
        </div>
        <ul className="divide-y divide-border">
          {m.roles.map((role) => (
            <li key={role.role} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="text-label-md text-foreground">{t(`common:roles.${role.role}`)}</span>
              <span className="text-body-sm text-muted-foreground">{coverageLabel([role])}</span>
            </li>
          ))}
        </ul>
        {self && <p className="text-body-sm text-muted-foreground">{t('detail.selfNote')}</p>}
      </section>

      <EditRolesDialog member={m} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
