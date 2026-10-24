import { useMemo, useState, type ReactNode } from 'react';
import { useSession } from '@/features/auth/hooks/use-session';
import { ActiveBranchContext, type ActiveBranch } from '../hooks/active-branch';
import { useBranches } from '../hooks/use-branches';
import { accessibleBranches, canSeeAllBranches } from '../model/branch-access';

const STORAGE_KEY = 'clinicflow:active-branch';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Holds the staff member's current branch, remembered across visits and limited to their branches. */
export function ActiveBranchProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: allBranches = [] } = useBranches();
  const [selectedId, setSelectedId] = useState<string | null>(readStored);

  const value = useMemo<ActiveBranch>(() => {
    const branches = accessibleBranches(user, allBranches);
    const canSeeAll = canSeeAllBranches(user);
    const isValid = selectedId === null ? canSeeAll : branches.some((b) => b.id === selectedId);
    const activeBranchId = isValid ? selectedId : (branches[0]?.id ?? null);

    return {
      branches,
      canSeeAll,
      activeBranchId,
      activeBranch: branches.find((b) => b.id === activeBranchId) ?? null,
      setActiveBranchId: (id) => {
        setSelectedId(id);
        try {
          if (id === null) localStorage.removeItem(STORAGE_KEY);
          else localStorage.setItem(STORAGE_KEY, id);
        } catch {
          // Not remembered without storage
        }
      },
    };
  }, [user, allBranches, selectedId]);

  return <ActiveBranchContext.Provider value={value}>{children}</ActiveBranchContext.Provider>;
}
