import { useTranslation } from 'react-i18next';
import type { RoleAssignment } from '@/features/auth/model/user';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import type { StaffStatus } from '../model/staff';

const STATUS_TONE: Record<StaffStatus, Tone> = { Active: 'success', Invited: 'info', Leaving: 'warning', Deactivated: 'neutral' };

export function StaffStatusChip({ status }: { status: StaffStatus }) {
  const { t } = useTranslation('staff');
  return <StatusChip tone={STATUS_TONE[status]}>{t(`status.${status}`)}</StatusChip>;
}

/** The member's roles as chips. */
export function RoleChips({ roles }: { roles: RoleAssignment[] }) {
  const { t } = useTranslation('common');
  return (
    <span className="flex flex-wrap gap-1.5">
      {roles.map((r) => (
        <StatusChip key={r.role} tone="primary">
          {t(`roles.${r.role}`)}
        </StatusChip>
      ))}
    </span>
  );
}
