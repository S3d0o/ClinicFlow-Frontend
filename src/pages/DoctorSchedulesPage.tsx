import { useState, useEffect } from 'react';
import { doctorsApi } from '@/api';
import type { Schedule, CreateScheduleRequest, DayOfWeek } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatTimeRange } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Page, PageHeader } from '@/components/layout/Page';
import { LoadingState } from '@/components/states';
import { Field } from '@/components/form/Field';
import { FormAlert } from '@/components/form/FormAlert';
import { cn } from '@/lib/utils';
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const weekDays: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const slotDurations = [10, 15, 20, 30, 45, 60, 90, 120];

const defaultCreateForm: Omit<CreateScheduleRequest, 'dayOfWeek'> = {
  startTime: '09:00',
  endTime: '17:00',
  slotDurationMinutes: 30,
};

// "HH:mm" or "HH:mm:ss" → minutes since midnight
const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Mirrors the backend's CreateScheduleRequestValidator so the doctor sees the problem before submitting
const getTimeWindowError = (startTime: string, endTime: string, slotDurationMinutes: number) => {
  if (!startTime || !endTime) return 'Start and end times are required.';
  const windowMinutes = toMinutes(endTime) - toMinutes(startTime);
  if (windowMinutes <= 0) return 'End time must be after start time.';
  if (windowMinutes < slotDurationMinutes) {
    return `The time window must fit at least one ${slotDurationMinutes}-minute slot.`;
  }
  return null;
};

const slotCount = (s: Pick<Schedule, 'startTime' | 'endTime' | 'slotDurationMinutes'>) =>
  Math.max(0, Math.floor((toMinutes(s.endTime) - toMinutes(s.startTime)) / s.slotDurationMinutes));

export function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Schedule | null>(null);
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState<CreateScheduleRequest>({
    dayOfWeek: 'Monday',
    ...defaultCreateForm,
  });

  // The API allows one schedule per weekday, so only days without one can be added
  const scheduledDays = new Set(schedules.map((s) => s.dayOfWeek));
  const availableDays = weekDays.filter((day) => !scheduledDays.has(day));

  const createError = getTimeWindowError(createForm.startTime, createForm.endTime, createForm.slotDurationMinutes);
  const editError = showEdit
    ? getTimeWindowError(showEdit.startTime, showEdit.endTime, showEdit.slotDurationMinutes)
    : null;

  const openCreate = (day?: DayOfWeek) => {
    const dayOfWeek = day ?? availableDays[0];
    if (!dayOfWeek) return;
    setCreateForm({ dayOfWeek, ...defaultCreateForm });
    setShowCreate(true);
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await doctorsApi.getSchedules();
      setSchedules(res.data);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async () => {
    if (createError || scheduledDays.has(createForm.dayOfWeek)) return;
    setSubmitting(true);
    try {
      await doctorsApi.createSchedule(createForm);
      toast.success(`Schedule created for ${createForm.dayOfWeek}`);
      setShowCreate(false);
      fetchSchedules();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create schedule'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit || editError) return;
    setSubmitting(true);
    try {
      await doctorsApi.updateSchedule(showEdit.id, {
        startTime: showEdit.startTime,
        endTime: showEdit.endTime,
        slotDurationMinutes: showEdit.slotDurationMinutes,
        isActive: showEdit.isActive,
      });
      toast.success('Schedule updated');
      setShowEdit(null);
      fetchSchedules();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update schedule'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await doctorsApi.deleteSchedule(showDelete);
      toast.success('Schedule deleted');
      setShowDelete(null);
      fetchSchedules();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete schedule'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTarget = schedules.find((s) => s.id === showDelete);

  return (
    <Page width="full">
      <PageHeader
        eyebrow="Clinic workspace"
        title="Weekly schedule"
        description="Set your working hours for each day. Patients can book slots generated from these hours for the next 14 days."
        actions={
          <Button
            variant="strong"
            onClick={() => openCreate()}
            disabled={loading || availableDays.length === 0}
            title={availableDays.length === 0 ? 'Every day already has a schedule' : undefined}
          >
            <Plus aria-hidden="true" /> Add hours
          </Button>
        }
      />

      {loading ? (
        <LoadingState label="Loading your schedule…" />
      ) : (
        <>
          {schedules.length === 0 && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-info/15 bg-info/[0.06] px-4 py-3.5 text-body-md">
              <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
              <p>
                <span className="font-semibold">You have no working hours yet.</span>{' '}
                <span className="text-muted-foreground">Add hours to at least one day so patients can book you.</span>
              </p>
            </div>
          )}
          <section aria-labelledby="planner-heading" className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
            <div className="mb-5">
              <h2 id="planner-heading" className="font-display text-headline-md">Working hours planner</h2>
              <p className="mt-0.5 text-body-sm text-muted-foreground">Sunday to Saturday. Changing a day regenerates its future open slots; booked visits are kept.</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {weekDays.map((day) => {
                const s = schedules.find((x) => x.dayOfWeek === day);
                const status = !s ? 'Not available' : s.isActive ? 'Accepting bookings' : 'Paused — not bookable';
                return (
                  <li key={day} className={cn('flex flex-col rounded-xl p-3', s ? 'bg-muted' : 'bg-muted/50')}>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <h3 className={cn('text-label-md', !s && 'text-muted-foreground')}>{day}</h3>
                      <span
                        className={cn('size-2 rounded-full', !s ? 'bg-input' : s.isActive ? 'bg-primary' : 'bg-warning')}
                        aria-hidden="true"
                      />
                      <span className="sr-only">{status}</span>
                    </div>
                    {s ? (
                      <>
                        <div className="mt-3 flex-1 rounded-lg bg-card px-3 py-2.5 shadow-xs">
                          <p className="text-sm font-semibold tabular-nums">{formatTimeRange(s.startTime, s.endTime)}</p>
                          <p className="mt-1 text-body-sm text-muted-foreground">
                            {s.slotDurationMinutes}-min slots · {slotCount(s)} per day
                          </p>
                          {!s.isActive && (
                            <p className="mt-2 inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-label-sm text-warning">Paused</p>
                          )}
                        </div>
                        <div className="mt-3 flex gap-1.5">
                          <Button variant="secondary" size="sm" className="flex-1 bg-card hover:bg-accent" onClick={() => setShowEdit(s)} aria-label={`Edit ${day} schedule`}>
                            <Pencil aria-hidden="true" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/[0.08] hover:text-destructive"
                            onClick={() => setShowDelete(s.id)}
                            aria-label={`Delete ${day} schedule`}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="flex flex-1 items-center justify-center px-2 py-6 text-center text-body-sm text-muted-foreground">Day off</p>
                        <Button variant="outline" size="sm" onClick={() => openCreate(day)} aria-label={`Add hours for ${day}`}>
                          <Plus aria-hidden="true" /> Add hours
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add working hours</DialogTitle>
            <DialogDescription>Bookable slots are generated from these hours for the next 14 days.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-day" className="text-label-md">Day of week</Label>
              <Select value={createForm.dayOfWeek} onValueChange={(v) => setCreateForm({ ...createForm, dayOfWeek: v as DayOfWeek })}>
                <SelectTrigger id="create-day" className="w-full" aria-describedby="create-day-hint"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableDays.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
              <p id="create-day-hint" className="text-body-sm text-muted-foreground">Only days without hours are listed. To change an existing day, edit it instead.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="create-start" label="Start time" required>
                <Input type="time" value={createForm.startTime} onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })} />
              </Field>
              <Field id="create-end" label="End time" required>
                <Input type="time" value={createForm.endTime} onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })} />
              </Field>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-duration" className="text-label-md">Slot length</Label>
              <Select value={String(createForm.slotDurationMinutes)} onValueChange={(v) => setCreateForm({ ...createForm, slotDurationMinutes: Number(v) })}>
                <SelectTrigger id="create-duration" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {slotDurations.map((m) => (<SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {createError ? (
              <FormAlert>{createError}</FormAlert>
            ) : (
              <p className="rounded-xl bg-muted px-3.5 py-2.5 text-body-md text-muted-foreground">
                {slotCount(createForm)} bookable slots on {createForm.dayOfWeek}s.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !!createError}>
              {submitting && <Spinner aria-hidden="true" />}
              {submitting ? 'Saving…' : 'Add hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!showEdit} onOpenChange={(open) => { if (!open) setShowEdit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {showEdit?.dayOfWeek} hours</DialogTitle>
            <DialogDescription>Future open slots are regenerated. Booked appointments are kept.</DialogDescription>
          </DialogHeader>
          {showEdit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field id="edit-start" label="Start time" required>
                  <Input type="time" value={showEdit.startTime} onChange={(e) => setShowEdit({ ...showEdit, startTime: e.target.value })} />
                </Field>
                <Field id="edit-end" label="End time" required>
                  <Input type="time" value={showEdit.endTime} onChange={(e) => setShowEdit({ ...showEdit, endTime: e.target.value })} />
                </Field>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-duration" className="text-label-md">Slot length</Label>
                <Select value={String(showEdit.slotDurationMinutes)} onValueChange={(v) => setShowEdit({ ...showEdit, slotDurationMinutes: Number(v) })}>
                  <SelectTrigger id="edit-duration" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{slotDurations.map((m) => (<SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-xl bg-muted px-4 py-3">
                <div>
                  <Label htmlFor="edit-active">Accept bookings</Label>
                  <p id="edit-active-hint" className="mt-1 text-body-sm text-muted-foreground">Turn off to pause this day without deleting it.</p>
                </div>
                <Switch id="edit-active" aria-describedby="edit-active-hint" checked={showEdit.isActive} onCheckedChange={(v) => setShowEdit({ ...showEdit, isActive: v })} />
              </div>
              {editError && <FormAlert>{editError}</FormAlert>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting || !!editError}>
              {submitting && <Spinner aria-hidden="true" />}
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!showDelete} onOpenChange={(open) => { if (!open) setShowDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.dayOfWeek ?? 'this'} schedule?</DialogTitle>
            <DialogDescription>
              No new slots will be generated for this day. To stop bookings temporarily, edit the schedule and pause it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)} disabled={submitting}>Keep schedule</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Spinner aria-hidden="true" />}
              {submitting ? 'Deleting…' : 'Delete schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
