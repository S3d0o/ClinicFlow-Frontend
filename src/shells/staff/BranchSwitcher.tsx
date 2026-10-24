import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { branchName } from '@/features/org/model/branch-access';
import { useLanguage } from '@/shared/i18n/use-language';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ALL = 'all';

/** Picks the branch staff screens work on. A single-branch user just sees their branch. */
export function BranchSwitcher() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { branches, activeBranchId, canSeeAll, setActiveBranchId } = useActiveBranch();

  if (branches.length === 0) return null;
  if (branches.length === 1 && !canSeeAll) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-label-md text-foreground">
        <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
        {branchName(branches[0], language)}
      </p>
    );
  }

  return (
    <Select
      value={activeBranchId ?? ALL}
      onValueChange={(value) => setActiveBranchId(value === ALL ? null : value)}
    >
      <SelectTrigger aria-label={t('branch.label')} className="w-full">
        <Building2 aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {canSeeAll && <SelectItem value={ALL}>{t('branch.all')}</SelectItem>}
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branchName(branch, language)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
