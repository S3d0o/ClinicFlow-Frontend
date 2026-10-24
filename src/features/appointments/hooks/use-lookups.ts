import { useCallback } from 'react';
import { useServiceCatalog, useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';

/** Names for the ids appointments and visits carry: branches, specialties, services. */
export function useLookups() {
  const { language } = useLanguage();
  const { data: branches = [] } = useBranches();
  const { data: specialties = [] } = useSpecialties();
  const { data: services = [] } = useServiceCatalog();

  const branch = useCallback((id: string) => branches.find((b) => b.id === id), [branches]);
  const branchLabel = useCallback((id: string) => {
    const found = branches.find((b) => b.id === id);
    return found ? branchName(found, language) : '';
  }, [branches, language]);
  const specialtyLabel = useCallback((id: string) => {
    const found = specialties.find((s) => s.id === id);
    return found ? nameIn(found, language) : '';
  }, [specialties, language]);
  const service = useCallback((id: string) => services.find((s) => s.id === id), [services]);
  const serviceLabel = useCallback((id: string) => {
    const found = services.find((s) => s.id === id);
    return found ? nameIn(found, language) : '';
  }, [services, language]);

  return { branches, branch, branchLabel, specialtyLabel, service, serviceLabel };
}
