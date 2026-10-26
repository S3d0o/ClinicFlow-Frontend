import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui/states';
import { useActiveBranch } from '../hooks/active-branch';
import type { Branch } from '../model/branch';

/**
 * Screens that work on one branch (the front desk, the queue, the cash drawer). Organization-wide users
 * looking at "All branches" are asked to pick one first.
 */
export function BranchRequired({ children }: { children: (branch: Branch) => ReactNode }) {
  const { t } = useTranslation();
  const { activeBranch } = useActiveBranch();
  if (!activeBranch) {
    return (
      <EmptyState
        className="rounded-2xl border border-dashed border-border"
        icon={<Building2 aria-hidden="true" className="size-8 text-muted-foreground" />}
        title={t('branch.requiredTitle')}
        description={t('branch.requiredBody')}
      />
    );
  }
  return children(activeBranch);
}
