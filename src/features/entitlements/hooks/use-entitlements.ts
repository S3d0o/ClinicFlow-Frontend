import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { PlanCode } from '../api/entitlements.service';
import type { AddOnModule, ModuleCode } from '../model/modules';

export const entitlementsKeys = {
  all: ['entitlements'] as const,
  modules: ['entitlements', 'modules'] as const,
  subscription: ['entitlements', 'subscription'] as const,
  plans: ['entitlements', 'plans'] as const,
};

/**
 * The clinic's enabled modules. `modules` is undefined while loading or if the call failed; the UI
 * then hides nothing and the backend still refuses what the plan doesn't include.
 */
export function useEnabledModules(): { modules: ReadonlySet<ModuleCode> | undefined; isLoading: boolean } {
  const { entitlements } = useServices();
  const query = useQuery({
    queryKey: entitlementsKeys.modules,
    queryFn: () => entitlements.getEnabledModules(),
    staleTime: 5 * 60_000,
  });
  const modules = useMemo(() => (query.data ? new Set(query.data) : undefined), [query.data]);
  return { modules, isLoading: query.isPending && query.fetchStatus !== 'idle' };
}

export function useSubscription() {
  const { entitlements } = useServices();
  return useQuery({ queryKey: entitlementsKeys.subscription, queryFn: () => entitlements.getSubscription() });
}

export function usePlans() {
  const { entitlements } = useServices();
  return useQuery({ queryKey: entitlementsKeys.plans, queryFn: () => entitlements.listPlans(), staleTime: Infinity });
}

/** Demo only: whether the backend lets the demo switch the plan, and the two switches. */
export function useDemoPlatform() {
  const { demoPlatform } = useServices();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: entitlementsKeys.all });
  const setPlan = useMutation({ mutationFn: (code: PlanCode) => demoPlatform!.setPlan(code), onSuccess: refresh });
  const setModule = useMutation({
    mutationFn: ({ module, enabled }: { module: AddOnModule; enabled: boolean }) => demoPlatform!.setModule(module, enabled),
    onSuccess: refresh,
  });
  return { available: !!demoPlatform, setPlan, setModule };
}
