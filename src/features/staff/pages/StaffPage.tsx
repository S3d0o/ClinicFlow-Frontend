import { useState, type FormEvent } from 'react';
import { ChevronRight, Search, ShieldAlert, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { branchName } from '@/features/org/model/branch-access';
import { pageCount } from '@/shared/api/page';
import { useLanguage } from '@/shared/i18n/use-language';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pagination } from '@/shared/ui/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { InviteStaffSheet } from '../components/InviteStaffSheet';
import { RoleChips, StaffStatusChip } from '../components/StaffBits';
import { useBranchCoverageLabel } from '../hooks/use-branch-coverage';
import { useStaffList } from '../hooks/use-staff';
import { STAFF_ROLES, STAFF_STATUSES, type StaffFilter, type StaffRole, type StaffStatus } from '../model/staff';

const PAGE_SIZE = 20;
const ALL = 'all';

/** The staff directory: search by name, role, branch and status (FR-STF-08; design admin/02). */
export default function StaffPage() {
  const { t } = useTranslation(['staff', 'screens', 'common']);
  const { language } = useLanguage();
  const { user } = useSession();
  const { data: branches = [] } = useBranches();
  const coverageLabel = useBranchCoverageLabel();
  const [filter, setFilter] = useState<StaffFilter>({});
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [inviting, setInviting] = useState(false);
  const list = useStaffList(filter, { page, pageSize: PAGE_SIZE });

  const change = (next: Partial<StaffFilter>) => {
    setFilter((current) => ({ ...current, ...next }));
    setPage(1);
  };
  const submitText = (event: FormEvent) => {
    event.preventDefault();
    change({ text: text.trim() || undefined });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('screens:staff')}
        description={t('directory.description')}
        actions={
          can(user, 'staff.invite') && (
            <Button onClick={() => setInviting(true)}>
              <UserPlus aria-hidden="true" />
              {t('invite.open')}
            </Button>
          )
        }
      />

      <section aria-label={t('directory.filters')} className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:grid-cols-[2fr_1fr_1fr_1fr]">
        <form role="search" onSubmit={submitText} className="relative">
          <label htmlFor="staff-search" className="sr-only">
            {t('directory.search')}
          </label>
          <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="staff-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => change({ text: text.trim() || undefined })}
            placeholder={t('directory.searchPlaceholder')}
            className="ps-9"
          />
        </form>
        <Select value={filter.role ?? ALL} onValueChange={(value) => change({ role: value === ALL ? undefined : (value as StaffRole) })}>
          <SelectTrigger aria-label={t('directory.role')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('directory.allRoles')}</SelectItem>
            {STAFF_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {t(`common:roles.${role}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.branchId ?? ALL} onValueChange={(value) => change({ branchId: value === ALL ? undefined : value })}>
          <SelectTrigger aria-label={t('directory.branch')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('roles.allBranches')}</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branchName(branch, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.status ?? ALL} onValueChange={(value) => change({ status: value === ALL ? undefined : (value as StaffStatus) })}>
          <SelectTrigger aria-label={t('directory.status')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('directory.allStatuses')}</SelectItem>
            {STAFF_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {list.isPending ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={<Users />} title={t('directory.emptyTitle')} description={t('directory.emptyBody')} />
      ) : (
        <section aria-labelledby="staff-count" className="space-y-4">
          <p id="staff-count" aria-live="polite" className="text-body-md text-muted-foreground">
            {t('directory.count', { count: list.data.total })}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {list.data.items.map((member) => (
              <li key={member.id}>
                <Link
                  to={`/admin/staff/${member.id}`}
                  className="grid items-center gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none md:grid-cols-[2fr_1.5fr_1.5fr_auto_auto]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={member.fullName} size="sm" />
                    <span className="min-w-0">
                      <bdi className="block truncate text-label-md text-foreground">{member.fullName}</bdi>
                      {member.email && (
                        <span dir="ltr" className="block truncate text-caption text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </span>
                  </span>
                  <RoleChips roles={member.roles} />
                  <span className="text-body-sm text-muted-foreground">{coverageLabel(member.roles)}</span>
                  <span className="flex items-center gap-2">
                    <StaffStatusChip status={member.status} />
                    {member.status !== 'Invited' && !member.mfaEnrolled && (
                      <ShieldAlert aria-label={t('detail.mfaMissing')} className="size-4 text-warning" />
                    )}
                  </span>
                  <ChevronRight aria-hidden="true" className="rtl-flip hidden size-4 text-muted-foreground md:block" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount(list.data.total, PAGE_SIZE)} onChange={setPage} />
        </section>
      )}

      <InviteStaffSheet open={inviting} onOpenChange={setInviting} />
    </div>
  );
}
