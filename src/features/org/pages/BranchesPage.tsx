import { useState } from 'react';
import { Clock, MapPin, Pencil, Plus, Power } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { BranchFormDialog } from '../components/BranchFormDialog';
import { HolidaysPanel } from '../components/HolidaysPanel';
import { HoursEditor } from '../components/HoursEditor';
import { RoomsPanel } from '../components/RoomsPanel';
import { useBranchClock } from '../hooks/use-branch-clock';
import { useAllBranches, useSetBranchActive } from '../hooks/use-org-admin';
import { branchName } from '../model/branch-access';
import type { Branch } from '../model/branch';

/** The clinic's branches, and each one's hours, holidays and rooms (FR-ORG-02, 03, 04; design admin/05). */
export default function BranchesPage() {
  const { t } = useTranslation(['orgAdmin', 'screens', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const branches = useAllBranches();
  const setActive = useSetBranchActive();
  const [selectedId, setSelectedId] = useState<string>();
  const [form, setForm] = useState<{ open: boolean; branch?: Branch }>({ open: false });
  const selected = branches.data?.find((b) => b.id === selectedId) ?? branches.data?.[0];
  const { today } = useBranchClock(selected);

  if (branches.isPending) return <LoadingState />;
  if (branches.isError) return <ErrorState onRetry={() => void branches.refetch()} />;

  const toggle = (branch: Branch) =>
    setActive.mutate(
      { branchId: branch.id, active: !branch.isActive },
      { onSuccess: (saved) => toast.success(t(saved.isActive ? 'branches.reactivated' : 'branches.deactivated', { name: branchName(saved, language) })) }
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('screens:branches')}
        description={t('branches.description')}
        actions={
          <Button onClick={() => setForm({ open: true })}>
            <Plus aria-hidden="true" />
            {t('branches.add')}
          </Button>
        }
      />

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {branches.data.map((branch) => {
          const current = branch.id === selected?.id;
          return (
            <li key={branch.id}>
              <button
                type="button"
                aria-pressed={current}
                onClick={() => setSelectedId(branch.id)}
                className={cn(
                  'flex h-full w-full flex-col gap-3 rounded-xl border bg-card p-4 text-start shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  current ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50',
                  !branch.isActive && 'bg-muted/40'
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary font-display text-title-sm text-primary">
                      {branch.code}
                    </span>
                    <span className="text-title-sm text-ink">{branchName(branch, language)}</span>
                  </span>
                  <StatusChip tone={branch.isActive ? 'success' : 'neutral'}>{t(branch.isActive ? 'branches.active' : 'branches.inactive')}</StatusChip>
                </span>
                <span className="flex items-start gap-2 text-body-sm text-muted-foreground">
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {language === 'ar' ? branch.addressAr : branch.addressEn}
                </span>
                <span className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Clock aria-hidden="true" className="size-4 shrink-0" />
                  <span dir="ltr">{branch.timeZone}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {setActive.error && <FormAlert>{errorMessage(setActive.error)}</FormAlert>}

      {selected && (
        <section aria-labelledby="branch-workspace" className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{t('branches.workspace')}</p>
              <h2 id="branch-workspace" className="font-display text-headline-md text-ink">
                {branchName(selected, language)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setForm({ open: true, branch: selected })}>
                <Pencil aria-hidden="true" />
                {t('branches.edit')}
              </Button>
              <Button variant={selected.isActive ? 'destructive-outline' : 'outline'} disabled={setActive.isPending} onClick={() => toggle(selected)}>
                <Power aria-hidden="true" />
                {t(selected.isActive ? 'branches.deactivate' : 'branches.reactivate')}
              </Button>
            </div>
          </div>
          {!selected.isActive && <p className="text-body-sm text-muted-foreground">{t('branches.inactiveNote')}</p>}
          <Tabs defaultValue="hours" key={selected.id} className="space-y-4">
            <TabsList>
              <TabsTrigger value="hours">{t('hours.title')}</TabsTrigger>
              <TabsTrigger value="holidays">{t('holidays.title')}</TabsTrigger>
              <TabsTrigger value="rooms">{t('rooms.title')}</TabsTrigger>
            </TabsList>
            <TabsContent value="hours">
              <HoursEditor branchId={selected.id} />
            </TabsContent>
            <TabsContent value="holidays">
              <HolidaysPanel branchId={selected.id} today={today} />
            </TabsContent>
            <TabsContent value="rooms">
              <RoomsPanel branchId={selected.id} />
            </TabsContent>
          </Tabs>
        </section>
      )}

      <BranchFormDialog
        branch={form.branch}
        open={form.open}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
        onSaved={(saved) => setSelectedId(saved.id)}
      />
    </div>
  );
}
