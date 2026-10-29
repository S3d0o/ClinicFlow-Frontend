import { useTranslation } from 'react-i18next';
import type { RoleAssignment } from '@/features/auth/model/user';
import { useBranches } from '@/features/org/hooks/use-branches';
import { branchName } from '@/features/org/model/branch-access';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatList } from '@/shared/lib/intl';
import { branchCoverage } from '../model/staff';

/** "All branches", or the names of the branches a member's roles cover. */
export function useBranchCoverageLabel() {
  const { t } = useTranslation('staff');
  const { language } = useLanguage();
  const { data: branches = [] } = useBranches();
  return (roles: RoleAssignment[]) => {
    const coverage = branchCoverage(roles);
    if (coverage === 'all') return t('roles.allBranches');
    return formatList(branches.filter((b) => coverage.includes(b.id)).map((b) => branchName(b, language)), language);
  };
}
