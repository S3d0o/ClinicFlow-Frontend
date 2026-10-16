import { useState, useEffect } from 'react';
import { adminApi } from '@/api';
import type { DoctorSummary } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatFee } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, LoadingState } from '@/components/states';
import { UserAvatar } from '@/components/UserAvatar';
import { Check, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPendingDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'suspend' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingDoctors();
      setDoctors(res.data);
    } catch {
      toast.error('Failed to load pending doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const closeDialog = () => {
    setActionId(null);
    setActionType(null);
  };

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await adminApi.approveDoctor(actionId);
        toast.success('Doctor approved');
      } else {
        await adminApi.suspendDoctor(actionId);
        toast.success('Doctor rejected and suspended');
      }
      closeDialog();
      fetchDoctors();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Action failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const open = (id: number, type: 'approve' | 'suspend') => {
    setActionId(id);
    setActionType(type);
  };

  const target = doctors.find((d) => d.id === actionId);

  const actions = (d: DoctorSummary) => (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => open(d.id, 'approve')} aria-label={`Approve ${d.fullName}`}>
        <Check aria-hidden="true" /> Approve
      </Button>
      <Button size="sm" variant="destructive-outline" onClick={() => open(d.id, 'suspend')} aria-label={`Reject ${d.fullName}`}>
        <X aria-hidden="true" /> Reject
      </Button>
    </div>
  );

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Clinic administration"
        title="Doctor approvals"
        description="New doctors appear in search only after you approve them. Review each application below."
        actions={
          !loading && doctors.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-label-md text-warning">
              <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
              {doctors.length} awaiting review
            </span>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingState label="Loading applications…" />
      ) : doctors.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All caught up" description="There are no doctors waiting for approval." />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Doctors waiting for approval</caption>
              <thead className="bg-muted text-left text-label-sm uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Doctor</th>
                  <th scope="col" className="px-5 py-3">City</th>
                  <th scope="col" className="px-5 py-3 text-right">Experience</th>
                  <th scope="col" className="px-5 py-3 text-right">Fee</th>
                  <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {doctors.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={d.fullName} />
                        <div className="min-w-0">
                          <p className="truncate text-label-md">{d.fullName}</p>
                          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-label-sm text-primary">{d.specialtyName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{d.clinicCity || '—'}</td>
                    <td className="px-5 py-4 text-right tabular-nums">{d.yearsOfExperience} yrs</td>
                    <td className="px-5 py-4 text-right tabular-nums">{formatFee(d.consultationFee)}</td>
                    <td className="px-5 py-4"><div className="flex justify-end">{actions(d)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {doctors.map((d) => (
              <li key={d.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <UserAvatar name={d.fullName} />
                  <div className="min-w-0">
                    <p className="truncate text-label-md">{d.fullName}</p>
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-label-sm text-primary">{d.specialtyName}</span>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted px-3 py-3 text-sm">
                  <div><dt className="text-caption uppercase tracking-wider text-muted-foreground">City</dt><dd className="truncate font-medium">{d.clinicCity || '—'}</dd></div>
                  <div><dt className="text-caption uppercase tracking-wider text-muted-foreground">Experience</dt><dd className="font-medium tabular-nums">{d.yearsOfExperience} yrs</dd></div>
                  <div><dt className="text-caption uppercase tracking-wider text-muted-foreground">Fee</dt><dd className="font-medium tabular-nums">{formatFee(d.consultationFee)}</dd></div>
                </dl>
                <div className="mt-4">{actions(d)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={!!actionId} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? `Approve ${target?.fullName ?? 'doctor'}?` : `Reject ${target?.fullName ?? 'doctor'}?`}</DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'They’ll appear in search, can publish their hours, and will be notified.'
                : 'Rejecting suspends the account: it’s deactivated and the doctor can no longer sign in.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>Cancel</Button>
            <Button variant={actionType === 'approve' ? 'default' : 'destructive'} onClick={handleAction} disabled={submitting}>
              {submitting && <Spinner aria-hidden="true" />}
              {actionType === 'approve' ? 'Approve doctor' : 'Reject & suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
