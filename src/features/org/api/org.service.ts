import type { Branch } from '../model/branch';

/** Organization reference data (port). */
export interface OrgService {
  listBranches(): Promise<Branch[]>;
}
