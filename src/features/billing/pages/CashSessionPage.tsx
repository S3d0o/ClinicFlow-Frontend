import { useState, type FormEvent } from 'react';
import { Banknote, CircleMinus, CirclePlus, Landmark, Printer, Vault } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { BranchRequired } from '@/features/org/components/BranchRequired';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import type { Branch } from '@/features/org/model/branch';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { formatInstant, formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { ChoiceCard } from '@/shared/ui/ChoiceCard';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatTile } from '@/shared/ui/StatTile';
import { StatusChip } from '@/shared/ui/StatusChip';
import { CloseSessionForm } from '../components/CloseSessionForm';
import { useCurrentCashSession, useDownloadCashReport, useDrawers, useOpenCashSession } from '../hooks/use-checkout';
import type { CashSession } from '../model/cash-session';

const METHOD_BAR: Record<string, string> = { Cash: 'bg-ink', Card: 'bg-info', Wallet: 'bg-highlight' };

function OpenSessionForm({ branch }: { branch: Branch }) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const drawers = useDrawers(branch.id);
  const open = useOpenCashSession();
  const [drawerId, setDrawerId] = useState('');
  const [float, setFloat] = useState('500');
  const amount = /^\d+(\.\d{1,2})?$/.test(float.trim()) ? Number(float) : Number.NaN;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!drawerId || Number.isNaN(amount)) return;
    open.mutate({ drawerId, openingFloat: amount });
  };

  if (drawers.isPending) return <LoadingState />;
  if (drawers.isError) return <ErrorState onRetry={() => void drawers.refetch()} />;

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div>
        <h2 className="font-display text-headline-md text-ink">{t('cash.open.title')}</h2>
        <p className="text-body-sm text-muted-foreground">{t('cash.open.intro')}</p>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-label-md text-foreground">{t('cash.open.drawer')}</legend>
        {drawers.data.map((drawer) => (
          <ChoiceCard
            key={drawer.id}
            name="drawer"
            value={drawer.id}
            checked={drawerId === drawer.id}
            disabled={!!drawer.inUseBy}
            onChange={() => setDrawerId(drawer.id)}
            icon={<Vault className="size-5" />}
            label={nameIn(drawer, language)}
            description={drawer.inUseBy ? t('cash.open.inUse', { name: drawer.inUseBy }) : t('cash.open.free')}
          />
        ))}
      </fieldset>
      <Field label={t('cash.open.float')} hint={t('cash.open.floatHint')} error={float && Number.isNaN(amount) ? t('cash.open.floatInvalid') : undefined} required>
        {(control) => <Input {...control} value={float} onChange={(e) => setFloat(e.target.value)} inputMode="decimal" dir="ltr" className="text-start tabular-nums" />}
      </Field>
      {open.isError && <FormAlert>{errorMessage(open.error)}</FormAlert>}
      <Button type="submit" size="lg" disabled={!drawerId || Number.isNaN(amount) || open.isPending}>
        <Banknote aria-hidden="true" />
        {t('cash.open.submit')}
      </Button>
    </form>
  );
}

function ClosedSummary({ session, onDone }: { session: CashSession; onDone: () => void }) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const report = useDownloadCashReport();
  const money = (amount: number) => formatMoney(amount, language);
  const variance = session.variance ?? 0;

  return (
    <section role="status" className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <h2 className="font-display text-headline-md text-ink">{t('cash.closed.title', { drawer: nameIn(session.drawer, language) })}</h2>
      <dl className="space-y-1.5 text-body-md">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t('cash.close.expected')}</dt>
          <dd className="tabular-nums">{money(session.expectedCash)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t('cash.close.counted')}</dt>
          <dd className="tabular-nums">{money(session.countedAmount ?? 0)}</dd>
        </div>
        <div className={cn('flex justify-between gap-3 border-t border-border pt-1.5 font-semibold', variance === 0 ? 'text-success' : session.needsApproval ? 'text-destructive' : 'text-warning')}>
          <dt>{t('cash.close.variance')}</dt>
          <dd className="tabular-nums">
            {variance === 0 ? t('cash.close.exact') : variance > 0 ? t('cash.close.over', { amount: money(variance) }) : t('cash.close.short', { amount: money(-variance) })}
          </dd>
        </div>
      </dl>
      <FormAlert tone={session.needsApproval ? 'error' : 'success'}>{session.needsApproval ? t('cash.closed.needsApproval') : t('cash.closed.balanced')}</FormAlert>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={report.isPending} onClick={() => report.mutate({ sessionId: session.id, fileName: `cash-session-${session.id}.pdf` })}>
          <Printer aria-hidden="true" />
          {t('cash.closed.report')}
        </Button>
        <Button onClick={onDone}>{t('cash.closed.openNew')}</Button>
      </div>
    </section>
  );
}

function OpenSession({ session, branch, onClosed }: { session: CashSession; branch: Branch; onClosed: (closed: CashSession) => void }) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const { serviceLabel } = useLookups();
  const { now, timeZone } = useBranchClock(branch, 60_000);
  const report = useDownloadCashReport();
  const money = (amount: number) => formatMoney(amount, language);
  const time = (iso: string) => formatInstant(iso, language, timeZone, { hour: 'numeric', minute: '2-digit' });
  const minutesOpen = Math.max(0, Math.floor((now.getTime() - Date.parse(session.openedAt)) / 60_000));
  const turnover = session.byMethod.reduce((sum, m) => sum + m.amount, 0);
  const cashPayments = session.transactions.filter((tx) => tx.method === 'Cash' && tx.kind === 'Payment').length;
  const refunds = session.transactions.filter((tx) => tx.kind === 'Refund' && tx.method === 'Cash').length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
          <Landmark className="size-6" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-display text-headline-md text-ink">{t('cash.session.title', { drawer: nameIn(session.drawer, language) })}</h2>
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
            <StatusChip tone="info">{t('cash.session.openFor', { hours: Math.floor(minutesOpen / 60), minutes: minutesOpen % 60 })}</StatusChip>
            <span>{t('cash.session.openedBy', { time: time(session.openedAt), name: session.openedByName })}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={report.isPending} onClick={() => report.mutate({ sessionId: session.id, fileName: `x-report-${session.id}.pdf` })}>
            <Printer aria-hidden="true" />
            {t('cash.session.xReport')}
          </Button>
          {/* A hash link would change the route (HashRouter), so this scrolls instead */}
          <Button variant="strong" onClick={() => document.getElementById('close-session')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('cash.session.close')}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t('cash.tiles.float')} value={money(session.openingFloat)} icon={<Vault className="size-5" />} />
        <StatTile label={t('cash.tiles.cashIn')} value={money(session.cashIn)} hint={t('cash.tiles.cashInHint', { count: cashPayments })} icon={<CirclePlus className="size-5" />} />
        <StatTile label={t('cash.tiles.cashOut')} value={money(session.cashOut)} hint={t('cash.tiles.cashOutHint', { count: refunds })} icon={<CircleMinus className="size-5" />} />
        <StatTile label={t('cash.tiles.expected')} value={money(session.expectedCash)} hint={t('cash.tiles.expectedHint')} icon={<Banknote className="size-5" />} className="border-2 border-ink" />
      </div>

      <section aria-labelledby="methods-heading" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="methods-heading" className="text-title-sm text-ink">{t('cash.methods.title')}</h2>
          <p className="text-body-sm text-muted-foreground">
            {t('cash.methods.total')} <span className="font-display text-headline-md text-ink">{money(turnover)}</span>
          </p>
        </div>
        {turnover > 0 && (
          <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-muted">
            {session.byMethod.map((m) => (
              <span key={m.method} className={METHOD_BAR[m.method]} style={{ width: `${(m.amount / turnover) * 100}%` }} />
            ))}
          </div>
        )}
        <ul className="grid gap-3 sm:grid-cols-3">
          {session.byMethod.map((m) => (
            <li key={m.method} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={cn('size-2.5 rounded-full', METHOD_BAR[m.method])} />
                <span>
                  <span className="block text-label-md text-foreground">{t(`pay.methods.${m.method}`)}</span>
                  <span className="block text-caption text-muted-foreground">{t('cash.methods.count', { count: m.count })}</span>
                </span>
              </span>
              <span className="text-end">
                <span className="block text-label-md tabular-nums">{money(m.amount)}</span>
                <span className="block text-caption text-muted-foreground">{turnover ? Math.round((m.amount / turnover) * 100) : 0}%</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section aria-labelledby="ledger-heading" className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 id="ledger-heading" className="text-title-sm text-ink">{t('cash.ledger.title')}</h2>
          {session.transactions.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">{t('cash.ledger.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-body-sm">
                <thead>
                  <tr className="border-b border-border text-label-sm uppercase text-muted-foreground">
                    <th scope="col" className="py-2 text-start font-semibold">{t('cash.ledger.time')}</th>
                    <th scope="col" className="py-2 text-start font-semibold">{t('cash.ledger.receipt')}</th>
                    <th scope="col" className="py-2 text-start font-semibold">{t('cash.ledger.patient')}</th>
                    <th scope="col" className="py-2 text-start font-semibold">{t('cash.ledger.for')}</th>
                    <th scope="col" className="py-2 text-start font-semibold">{t('cash.ledger.method')}</th>
                    <th scope="col" className="py-2 text-end font-semibold">{t('cash.ledger.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {session.transactions.map((tx) => (
                    <tr key={tx.id} className={cn('border-b border-border last:border-0', tx.kind === 'Refund' && 'bg-destructive/5')}>
                      <td className="py-2.5 tabular-nums"><bdi dir="ltr">{time(tx.at)}</bdi></td>
                      <td className="py-2.5 text-primary"><bdi dir="ltr">{tx.receiptNo}</bdi></td>
                      <td dir="auto" className="py-2.5 text-start">{tx.patientName}</td>
                      <td className="py-2.5">{tx.kind === 'Refund' ? t('cash.ledger.refund') : tx.serviceId ? serviceLabel(tx.serviceId) : t('cash.ledger.payment')}</td>
                      <td className="py-2.5">{t(`pay.methods.${tx.method}`)}</td>
                      <td className={cn('py-2.5 text-end tabular-nums font-medium', tx.amount < 0 ? 'text-destructive' : 'text-foreground')}>
                        {tx.amount < 0 ? `− ${money(-tx.amount)}` : `+ ${money(tx.amount)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <CloseSessionForm session={session} onClosed={onClosed} />
      </div>
    </div>
  );
}

function CashDrawerScreen({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['billing', 'screens']);
  const current = useCurrentCashSession();
  const [closed, setClosed] = useState<CashSession | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title={t('screens:deskCash')} description={t('cash.intro')} />
      {closed ? (
        <ClosedSummary session={closed} onDone={() => setClosed(null)} />
      ) : current.isPending ? (
        <LoadingState />
      ) : current.isError ? (
        <ErrorState onRetry={() => void current.refetch()} />
      ) : current.data ? (
        <OpenSession session={current.data} branch={branch} onClosed={setClosed} />
      ) : (
        <OpenSessionForm branch={branch} />
      )}
    </div>
  );
}

/** The receptionist's cash drawer (design front-desk/08, FR-BIL-09): open with a float, see the takings, close with a count. */
export default function CashSessionPage() {
  return <BranchRequired>{(branch) => <CashDrawerScreen branch={branch} />}</BranchRequired>;
}
