import { useState } from 'react';
import { adminApi } from '@/api';
import type { Specialty, CreateSpecialtyRequest } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useApiQuery } from '@/hooks/use-api-query';
import { Field } from '@/components/form/Field';
import { Pencil, Plus, Search, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

type SpecialtyForm = CreateSpecialtyRequest & { isActive: boolean };

export function AdminSpecialtiesPage() {
  const { data, loading, error, reload: fetchSpecialties } = useApiQuery(() =>
    adminApi.getAllSpecialties().then((res) => res.data)
  );
  const specialties: Specialty[] = data ?? [];
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Specialty | null>(null);
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // isActive is always sent: true for a new specialty, the switch's value on edit (API contract #41, #42)
  const [form, setForm] = useState<SpecialtyForm>({
    name: '',
    description: '',
    iconUrl: '',
    isActive: true,
  });

  const resetForm = () => {
    setForm({ name: '', description: '', iconUrl: '', isActive: true });
  };

  // Optional fields must be omitted rather than sent as "" (iconUrl must be an absolute URL)
  const toRequest = (): CreateSpecialtyRequest => ({
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    iconUrl: form.iconUrl?.trim() || undefined,
    isActive: form.isActive,
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
    setForm({ name: s.name, description: s.description || '', iconUrl: s.iconUrl || '', isActive: s.isActive });
    setShowEdit(s);
  };

  const closeForm = () => {
    setShowCreate(false);
    setShowEdit(null);
    resetForm();
  };

  const activeCount = specialties.filter((s) => s.isActive).length;
  const q = query.trim().toLowerCase();
  const visible = q ? specialties.filter((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)) : specialties;
  const deleteTarget = specialties.find((s) => s.id === showDelete);

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Clinic administration"
        title="Specialties"
        description={
          loading || error
            ? 'The medical specialties doctors can register under.'
            : `${specialties.length} specialties · ${activeCount} active. Doctors choose one when they register.`
        }
        actions={
          <Button variant="strong" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus aria-hidden="true" /> Add specialty
          </Button>
        }
      />

      {loading ? (
        <LoadingState label="Loading specialties…" />
      ) : error ? (
        <ErrorState title="Couldn’t load specialties" message={getApiErrorMessage(error, 'Please try again in a moment.')} onRetry={fetchSpecialties} />
      ) : specialties.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No specialties yet"
          description="Add a specialty so doctors can register under it."
          action={<Button onClick={() => { resetForm(); setShowCreate(true); }}><Plus aria-hidden="true" /> Add specialty</Button>}
        />
      ) : (
        <section aria-labelledby="registry-heading" className="rounded-2xl border border-border/70 bg-card shadow-card">
          <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="registry-heading" className="font-display text-headline-md">Specialty registry</h2>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Search specialties"
                placeholder="Search specialties"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 bg-muted pl-10"
              />
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-body-md text-muted-foreground">No specialties match “{query.trim()}”.</p>
          ) : (
        <ul className="divide-y divide-border/70">
          {visible.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Shield className="size-[1.125rem]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-label-md">{s.name}</h3>
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-label-sm text-success"><span className="size-1.5 rounded-full bg-success" aria-hidden="true" />Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-label-sm text-muted-foreground"><span className="size-1.5 rounded-full bg-muted-foreground/60" aria-hidden="true" />Inactive</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-body-md text-muted-foreground">{s.description || 'No description'}</p>
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
        </section>
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
            <div className="flex items-start justify-between gap-4 rounded-xl bg-muted px-4 py-3">
              <div>
                <Label htmlFor="specialty-active">Active</Label>
                <p id="specialty-active-hint" className="mt-1 text-body-sm text-muted-foreground">
                  Inactive specialties are hidden from patients and from doctor registration. Turn it back on at any time.
                </p>
              </div>
              <Switch
                id="specialty-active"
                aria-describedby="specialty-active-hint"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
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
