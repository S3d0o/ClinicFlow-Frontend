import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/hooks/use-session';
import { PERMISSIONS, type Permission } from '@/features/auth/model/permissions';
import { ADD_ON_MODULES, CORE_MODULES, PERMISSION_MODULE, type ModuleCode } from '@/features/entitlements/model/modules';
import { cn } from '@/shared/lib/cn';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { GrantCode } from '../api/staff.service';
import { useRoleMatrix } from '../hooks/use-staff';

const MODULE_ORDER: ModuleCode[] = [...CORE_MODULES, ...ADD_ON_MODULES];
const GRANT_CODES: GrantCode[] = ['O', 'A', 'OO', 'S'];
const GRANT_STYLE: Record<GrantCode, string> = {
  O: 'bg-primary text-primary-foreground',
  A: 'bg-secondary text-primary',
  OO: 'border border-primary text-primary',
  S: 'bg-muted text-muted-foreground',
};

/** Which permissions each role holds, by module (02 §5–§6; design admin/04). Read-only in release R1. */
export default function RolesPage() {
  const { t } = useTranslation(['staff', 'entitlements', 'screens', 'common']);
  const { modules } = useSession();
  const matrix = useRoleMatrix();

  if (matrix.isPending) return <LoadingState />;
  if (matrix.isError) return <ErrorState onRetry={() => void matrix.refetch()} />;

  const byModule = MODULE_ORDER.map((module) => ({
    module,
    permissions: PERMISSIONS.filter((p) => PERMISSION_MODULE[p] === module),
  })).filter((group) => group.permissions.length > 0);

  const cell = (role: number, permission: Permission) => {
    const code = matrix.data[role].grants[permission];
    return code ? (
      <span title={t(`matrix.codes.${code}`)} className={cn('inline-flex min-w-8 justify-center rounded-md px-1.5 py-0.5 text-label-sm', GRANT_STYLE[code])}>
        {t(`matrix.short.${code}`)}
        <span className="sr-only">{t(`matrix.codes.${code}`)}</span>
      </span>
    ) : (
      <span aria-label={t('matrix.none')} className="text-muted-foreground/50">
        –
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('screens:roles')} description={t('matrix.description')} />

      <p className="flex gap-2 rounded-xl border border-info/30 bg-info/10 p-3 text-body-sm text-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
        {t('matrix.readOnly')}
      </p>

      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
        {GRANT_CODES.map((code) => (
          <div key={code} className="flex items-center gap-2">
            <dt className={cn('inline-flex min-w-8 justify-center rounded-md px-1.5 py-0.5 text-label-sm', GRANT_STYLE[code])}>{t(`matrix.short.${code}`)}</dt>
            <dd className="text-muted-foreground">{t(`matrix.codes.${code}`)}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[48rem] text-body-sm">
          <caption className="sr-only">{t('matrix.caption')}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/50 text-start">
              <th scope="col" className="px-4 py-3 text-start text-label-md text-muted-foreground">
                {t('matrix.permission')}
              </th>
              {matrix.data.map((row) => (
                <th key={row.role} scope="col" className="px-3 py-3 text-center text-label-md text-foreground">
                  {t(`common:roles.${row.role}`)}
                </th>
              ))}
            </tr>
          </thead>
          {byModule.map(({ module, permissions }) => {
            const off = modules ? !modules.has(module) : false;
            return (
              <tbody key={module} className={cn(off && 'opacity-60')}>
                <tr className="border-b border-border bg-secondary/40">
                  <th scope="colgroup" colSpan={matrix.data.length + 1} className="px-4 py-2 text-start">
                    <span className="flex items-center gap-2 text-label-md text-ink">
                      {t(`entitlements:modules.names.${module}`)}
                      {off && <StatusChip tone="neutral">{t('matrix.notInPlan')}</StatusChip>}
                    </span>
                  </th>
                </tr>
                {permissions.map((permission) => (
                  <tr key={permission} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-2 text-start font-normal">
                      <code dir="ltr" className="text-body-sm text-foreground">
                        {permission}
                      </code>
                    </th>
                    {matrix.data.map((row, index) => (
                      <td key={row.role} className="px-3 py-2 text-center">
                        {cell(index, permission)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
