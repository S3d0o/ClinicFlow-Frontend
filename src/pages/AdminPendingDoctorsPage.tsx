import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/api';
import type { DoctorSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  Banknote,
} from 'lucide-react';
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

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await adminApi.approveDoctor(actionId);
        toast.success('Doctor approved');
      } else {
        await adminApi.suspendDoctor(actionId);
        toast.success('Doctor suspended');
      }
      setActionId(null);
      setActionType(null);
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Pending Doctor Approvals</h1>
            <p className="text-sm text-slate-500">Review and approve doctor registration requests</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : doctors.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">All caught up!</h3>
                <p className="text-sm text-slate-400">No pending doctor approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor, i) => (
                <motion.div key={doctor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-slate-100 hover:border-teal-200 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                            {doctor.fullName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{doctor.fullName}</h3>
                            <p className="text-sm text-teal-600 font-medium">{doctor.specialtyName}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {doctor.clinicCity}</span>
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {doctor.yearsOfExperience}y exp</span>
                              <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> {doctor.consultationFee} EGP</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => { setActionId(doctor.id); setActionType('approve'); }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setActionId(doctor.id); setActionType('suspend'); }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={!!actionId} onOpenChange={() => { setActionId(null); setActionType(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              {actionType === 'approve' ? 'Approve Doctor' : 'Reject Doctor'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'This doctor will be able to set their schedule and accept appointments.'
                : 'This doctor account will be suspended.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionId(null); setActionType(null); }}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
              className={actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
