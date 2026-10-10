import { useState, useEffect } from 'react';
import { adminApi } from '@/api';
import type { Specialty, CreateSpecialtyRequest } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Field } from '@/components/form/Field';
import { Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

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

  // Optional fields must be omitted rather than sent as "" (iconUrl must be an absolute URL)
  const toRequest = (): CreateSpecialtyRequest => ({
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    iconUrl: form.iconUrl?.trim() || undefined,
  });

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await adminApi.createSpecialty(toRequest());
      toast.success('Specialty created');
      setShowCreate(false);
      resetForm();
      fetchSpecialties();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    setSubmitting(true);
    try {
      await adminApi.updateSpecialty(showEdit.id, toRequest());
      toast.success('Specialty updated');
      setShowEdit(null);
      resetForm();
      fetchSpecialties();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update'));
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s: Specialty) => {
    setForm({ name: s.name, description: s.description || '', iconUrl: s.iconUrl || '' });
    setShowEdit(s);
  };

  const closeForm = () => {
    setShowCreate(false);
    setShowEdit(null);
    resetForm();
  };

  const activeCount = specialties.filter((s) => s.isActive).length;
  const deleteTarget = specialties.find((s) => s.id === showDelete);

  return (
    <Page>
      <PageHeader
        title="Specialties"
        description={
          loading
            ? 'The medical specialties doctors can register under.'
            : `${specialties.length} specialties · ${activeCount} active. Doctors choose one when they register.`
        }
        actions={
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus aria-hidden="true" /> Add specialty
          </Button>
        }
      />

      {loading ? (
        <LoadingState label="Loading specialties…" />
      ) : specialties.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No specialties yet"
          description="Add a specialty so doctors can register under it."
          action={<Button onClick={() => { resetForm(); setShowCreate(true); }}><Plus aria-hidden="true" /> Add specialty</Button>}
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-card">
          {specialties.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Shield className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{s.name}</h2>
                    {s.isActive ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">Active</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Inactive</span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{s.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex gap-1 self-end sm:self-auto">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>
                  <Pencil aria-hidden="true" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/[0.06] hover:text-destructive"
                  onClick={() => setShowDelete(s.id)}
                  aria-label={`Delete ${s.name}`}
                >
                  <Trash2 aria-hidden="true" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit dialog */}
      <Dialog open={showCreate || !!showEdit} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{showEdit ? `Edit ${showEdit.name}` : 'Add specialty'}</DialogTitle>
            <DialogDescription>{showEdit ? 'Update how this specialty appears to patients and doctors.' : 'Doctors will be able to register under this specialty.'}</DialogDescription>
          </DialogHeader>
          <form
            id="specialty-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim() || submitting) return;
              if (showEdit) handleEdit();
              else handleCreate();
            }}
          >
            <Field id="specialty-name" label="Name" required hint="Must be unique.">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cardiology" maxLength={NAME_MAX_LENGTH} />
            </Field>
            <Field id="specialty-description" label="Description" optional hint={`${form.description?.length ?? 0}/${DESCRIPTION_MAX_LENGTH}`}>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this specialty covers" maxLength={DESCRIPTION_MAX_LENGTH} />
            </Field>
            <Field id="specialty-icon" label="Icon URL" optional hint="A full URL starting with https://">
              <Input type="url" inputMode="url" value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://…" />
            </Field>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={submitting}>Cancel</Button>
            <Button type="submit" form="specialty-form" disabled={submitting || !form.name.trim()}>
              {submitting && <Spinner aria-hidden="true" />}
              {showEdit ? 'Save changes' : 'Add specialty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!showDelete} onOpenChange={(o) => { if (!o) setShowDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name ?? 'specialty'}?</DialogTitle>
            <DialogDescription>This can’t be undone. Specialties that doctors are registered under can’t be deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Spinner aria-hidden="true" />}
              {submitting ? 'Deleting…' : 'Delete specialty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
