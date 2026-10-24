import { createContext, useContext } from 'react';
import type { Branch } from '../model/branch';

/** The branch a staff screen works on. `null` means "All branches" (organization-wide users only). */
export interface ActiveBranch {
  branches: Branch[];
  activeBranchId: string | null;
  activeBranch: Branch | null;
  canSeeAll: boolean;
  setActiveBranchId: (id: string | null) => void;
}

export const ActiveBranchContext = createContext<ActiveBranch | null>(null);

export function useActiveBranch(): ActiveBranch {
  const value = useContext(ActiveBranchContext);
  if (!value) throw new Error('useActiveBranch must be used inside <ActiveBranchProvider>');
  return value;
}
