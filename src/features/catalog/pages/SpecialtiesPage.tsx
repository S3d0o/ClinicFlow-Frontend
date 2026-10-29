import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Shapes } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { nameIn, type Bilingual } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { useSaveSpecialty, useServiceCatalog, useSpecialties } from '../hooks/use-catalog';
import type { Specialty } from '../model/catalog';

/** The specialty catalog in both languages (V1 feature, `specialties.manage`; design admin/09). */
export default function SpecialtiesPage() {
  const { t } = useTranslation(['orgAdmin', 'screens', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const specialties = useSpecialties();
  const { data: services = [] } = useServiceCatalog();
  const [editing, setEditing] = useState<Specialty | 'new' | null>(null);
  const [names, setNames] = useState<Bilingual>({ nameEn: '', nameAr: '' });
  const [touched, setTouched] = useState(false);
  const save = useSaveSpecialty();

  if (specialties.isPending) return <LoadingState />;
  if (specialties.isError) return <ErrorState onRetry={() => void specialties.refetch()} />;

  const open = (specialty: Specialty | 'new') => {
    setNames(specialty === 'new' ? { nameEn: '', nameAr: '' } : { nameEn: specialty.nameEn, nameAr: specialty.nameAr });
    setTouched(false);
    save.reset();
    setEditing(specialty);
  };
  const missing = (value: string) => (touched && !value.trim() ? t('common:validation.required') : undefined);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!names.nameEn.trim() || !names.nameAr.trim()) return;
    save.mutate(
      { id: editing === 'new' ? undefined : editing?.id, value: names },
      {
        onSuccess: () => {
          toast.success(t('specialties.saved'));
          setEditing(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('screens:specialties')}
        description={t('specialties.description')}
        actions={
          <Button onClick={() => open('new')}>
            <Plus aria-hidden="true" />
            {t('specialties.add')}
          </Button>
        }
      />
      {specialties.data.length === 0 ? (
        <EmptyState icon={<Shapes />} title={t('specialties.emptyTitle')} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {specialties.data.map((specialty) => {
            const count = services.filter((s) => s.specialtyId === specialty.id).length;
            return (
              <li key={specialty.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="space-y-1">
                  <p className="text-title-sm text-ink">{nameIn(specialty, language)}</p>
                  <p className="text-body-sm text-muted-foreground" dir={language === 'ar' ? 'ltr' : 'rtl'}>
                    {language === 'ar' ? specialty.nameEn : specialty.nameAr}
                  </p>
                  <p className="text-caption text-muted-foreground">{t('specialties.services', { count })}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={t('specialties.edit', { name: nameIn(specialty, language) })} onClick={() => open(specialty)}>
                  <Pencil aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(editing === 'new' ? 'specialties.addTitle' : 'specialties.editTitle')}</DialogTitle>
          </DialogHeader>
          <form noValidate onSubmit={submit} className="space-y-4">
            {save.error && <FormAlert>{errorMessage(save.error)}</FormAlert>}
            <Field label={t('specialties.nameEn')} error={missing(names.nameEn)} required>
              {(control) => <Input {...control} dir="ltr" value={names.nameEn} onChange={(e) => setNames((n) => ({ ...n, nameEn: e.target.value }))} />}
            </Field>
            <Field label={t('specialties.nameAr')} error={missing(names.nameAr)} required>
              {(control) => <Input {...control} dir="rtl" value={names.nameAr} onChange={(e) => setNames((n) => ({ ...n, nameAr: e.target.value }))} />}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {t('common:actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
