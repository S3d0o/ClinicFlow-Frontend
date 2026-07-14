import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doctorsApi } from '@/api';
import type { Schedule, CreateScheduleRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Schedule | null>(null);
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState<CreateScheduleRequest>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
  });

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
    setSubmitting(true);
    try {
      await doctorsApi.createSchedule(createForm);
      toast.success('Schedule created');
      setShowCreate(false);
      setCreateForm({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 });
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
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
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to update schedule');
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
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to delete schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Schedules</h1>
              <p className="text-sm text-slate-500">Set your weekly availability for appointments</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" /> Add Schedule
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : schedules.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="p-12 text-center">
                <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No schedules yet</h3>
                <p className="text-sm text-slate-400 mb-4">Add your first weekly schedule to start accepting appointments</p>
                <Button onClick={() => setShowCreate(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {weekDays.map((day, dayIndex) => {
                const daySchedules = schedules.filter((s) => String(s.dayOfWeek) === day);
                return (
                  <motion.div key={day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.03 }}>
                    <Card className="border-slate-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-800">{day}</h3>
                          <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)} className="text-teal-600 hover:text-teal-700 h-7 text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                          </Button>
                        </div>
                        {daySchedules.length === 0 ? (
                          <p className="text-sm text-slate-400 py-2">No schedule set</p>
                        ) : (
                          <div className="space-y-2">
                            {daySchedules.map((s) => (
                              <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg ${s.isActive ? 'bg-teal-50/50 border border-teal-100' : 'bg-slate-50 border border-slate-100'}`}>
                                <div className="flex items-center gap-3">
                                  <Clock className={`h-4 w-4 ${s.isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                                  <span className="text-sm font-medium text-slate-700">{s.startTime} - {s.endTime}</span>
                                  <span className="text-xs text-slate-400">({s.slotDurationMinutes} min slots)</span>
                                  {!s.isActive && <span className="px-1.5 py-0.5 rounded text-xs bg-slate-200 text-slate-500">Inactive</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" onClick={() => setShowEdit(s)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => setShowDelete(s.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Schedule</DialogTitle><DialogDescription>Set your availability for a day of the week</DialogDescription></DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={String(createForm.dayOfWeek)} onValueChange={(v) => setCreateForm({ ...createForm, dayOfWeek: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {weekDays.map((d, i) => (<SelectItem key={i} value={String(i)}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={createForm.startTime} onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Time</Label><Input type="time" value={createForm.endTime} onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (minutes)</Label>
              <Select value={String(createForm.slotDurationMinutes)} onValueChange={(v) => setCreateForm({ ...createForm, slotDurationMinutes: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => (<SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
              {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Schedule</DialogTitle><DialogDescription>Update your schedule for {showEdit && weekDays[showEdit.dayOfWeek]}</DialogDescription></DialogHeader>
          {showEdit && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={showEdit.startTime} onChange={(e) => setShowEdit({ ...showEdit, startTime: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Time</Label><Input type="time" value={showEdit.endTime} onChange={(e) => setShowEdit({ ...showEdit, endTime: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Slot Duration (minutes)</Label>
                <Select value={String(showEdit.slotDurationMinutes)} onValueChange={(v) => setShowEdit({ ...showEdit, slotDurationMinutes: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[10, 15, 20, 30, 45, 60, 90, 120].map((m) => (<SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={showEdit.isActive} onCheckedChange={(v) => setShowEdit({ ...showEdit, isActive: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
              {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Delete Schedule</DialogTitle>
            <DialogDescription>This will remove the schedule and stop generating future slots for this day.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
