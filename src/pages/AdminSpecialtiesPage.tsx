import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/api';
import type { Specialty, CreateSpecialtyRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Specialty | null>(null);
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateSpecialtyRequest>({
    name: '',
    description: '',
    iconUrl: '',
  });

  const fetchSpecialties = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllSpecialties();
      setSpecialties(res.data);
    } catch {
      toast.error('Failed to load specialties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', iconUrl: '' });
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await adminApi.createSpecialty(form);
      toast.success('Specialty created');
      setShowCreate(false);
      resetForm();
      fetchSpecialties();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    setSubmitting(true);
    try {
      await adminApi.updateSpecialty(showEdit.id, form);
      toast.success('Specialty updated');
      setShowEdit(null);
      resetForm();
      fetchSpecialties();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await adminApi.deleteSpecialty(showDelete);
      toast.success('Specialty deleted');
      setShowDelete(null);
      fetchSpecialties();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s: Specialty) => {
    setForm({ name: s.name, description: s.description || '', iconUrl: s.iconUrl || '' });
    setShowEdit(s);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Specialties</h1>
              <p className="text-sm text-slate-500">Manage medical specialties</p>
            </div>
            <Button onClick={() => { resetForm(); setShowCreate(true); }} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" /> Add Specialty
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : specialties.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-500">No specialties found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {specialties.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-slate-100 hover:border-teal-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{s.name}</h3>
                            {s.description && <p className="text-xs text-slate-500 line-clamp-2 max-w-[200px]">{s.description}</p>}
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs ${s.isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => setShowDelete(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!showEdit} onOpenChange={() => { setShowCreate(false); setShowEdit(null); resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{showEdit ? 'Edit Specialty' : 'Add Specialty'}</DialogTitle>
            <DialogDescription>{showEdit ? 'Update the specialty details' : 'Create a new medical specialty'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Cardiology" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." maxLength={500} />
            </div>
            <div className="space-y-2">
              <Label>Icon URL</Label>
              <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setShowEdit(null); resetForm(); }}>Cancel</Button>
            <Button onClick={showEdit ? handleEdit : handleCreate} disabled={submitting || !form.name} className="bg-teal-600 hover:bg-teal-700">
              {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : (showEdit ? 'Save Changes' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Delete Specialty</DialogTitle>
            <DialogDescription>This will permanently delete this specialty. Only allowed if no doctors are assigned.</DialogDescription>
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
