import { useTranslation } from 'react-i18next';
import type { RoleAssignment } from '@/features/auth/model/user';
import { useBranches } from '@/features/org/hooks/use-branches';
import { branchName } from '@/features/org/model/branch-access';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { STAFF_ROLES, type StaffRole } from '../model/staff';

interface RoleScopeEditorProps {
  value: RoleAssignment[];
  onChange: (roles: RoleAssignment[]) => void;
  /** Roles the signed-in user may grant; the others are shown but can't be picked. */
  grantable: StaffRole[];
  idPrefix: string;
}

/**
 * Picks roles and, for each, where it applies: every branch or chosen ones (02 §3). A member can hold
 * roles at different scopes, such as a manager of the whole clinic who also works as a doctor at one
 * branch.
 */
export function RoleScopeEditor({ value, onChange, grantable, idPrefix }: RoleScopeEditorProps) {
  const { t } = useTranslation(['staff', 'common']);
  const { language } = useLanguage();
  const { data: branches = [] } = useBranches();

  const assignment = (role: StaffRole) => value.find((r) => r.role === role);
  const replace = (role: StaffRole, next: RoleAssignment | null) => {
    const others = value.filter((r) => r.role !== role);
    onChange(next ? [...others, next].sort((a, b) => STAFF_ROLES.indexOf(a.role as StaffRole) - STAFF_ROLES.indexOf(b.role as StaffRole)) : others);
  };

  return (
    <ul className="space-y-2">
      {STAFF_ROLES.map((role) => {
        const current = assignment(role);
        const allowed = grantable.includes(role);
        const roleId = `${idPrefix}-${role}`;
        return (
          <li key={role} className={cn('rounded-xl border border-border bg-card p-3', current && 'border-primary/40 bg-secondary/40')}>
            <label htmlFor={roleId} className={cn('flex items-center gap-3', allowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}>
              <input
                id={roleId}
                type="checkbox"
                checked={!!current}
                disabled={!allowed && !current}
                onChange={(e) => replace(role, e.target.checked ? { role, scope: 'Organization' } : null)}
                className="size-5 shrink-0 rounded border-input accent-primary"
              />
              <span className="text-label-md text-foreground">{t(`common:roles.${role}`)}</span>
              {!allowed && <span className="text-caption text-muted-foreground">{t('roles.notGrantable')}</span>}
            </label>
            {current && (
              <fieldset className="mt-3 space-y-2 ps-8">
                <legend className="sr-only">{t('roles.scopeOf', { role: t(`common:roles.${role}`) })}</legend>
                <div className="flex flex-wrap gap-2">
                  {(['Organization', 'Branch'] as const).map((scope) => (
                    <label key={scope} className="flex cursor-pointer items-center gap-2 text-body-sm">
                      <input
                        type="radio"
                        name={`${roleId}-scope`}
                        checked={current.scope === scope}
                        disabled={!allowed}
                        onChange={() => replace(role, scope === 'Organization' ? { role, scope } : { role, scope, branchIds: [] })}
                        className="size-4 accent-primary"
                      />
                      {t(scope === 'Organization' ? 'roles.allBranches' : 'roles.someBranches')}
                    </label>
                  ))}
                </div>
                {current.scope === 'Branch' && (
                  <div className="flex flex-wrap gap-2">
                    {branches.map((branch) => {
                      const on = (current.branchIds ?? []).includes(branch.id);
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          aria-pressed={on}
                          disabled={!allowed}
                          onClick={() =>
                            replace(role, {
                              role,
                              scope: 'Branch',
                              branchIds: on ? (current.branchIds ?? []).filter((id) => id !== branch.id) : [...(current.branchIds ?? []), branch.id],
                            })
                          }
                          className={cn(
                            'min-h-8 rounded-full border px-3 text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'
                          )}
                        >
                          {branchName(branch, language)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            )}
          </li>
        );
      })}
    </ul>
  );
}
