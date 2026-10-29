import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { DoorOpen, Pencil, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import { Switch } from '@/shared/ui/switch';
import { useRooms, useSaveRoom } from '../hooks/use-org-admin';
import { roomSchema, type BranchRoom, type RoomKind, type RoomValues } from '../model/branch-admin';

const KINDS: RoomKind[] = ['Consultation', 'Procedure', 'Triage'];
const KIND_TONE: Record<RoomKind, Tone> = { Consultation: 'primary', Procedure: 'highlight', Triage: 'info' };

/** A branch's rooms: consultation, procedure and triage, each switched on or off (FR-ORG-04). */
export function RoomsPanel({ branchId }: { branchId: string }) {
  const { t } = useTranslation(['orgAdmin', 'common']);
  const { language } = useLanguage();
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const rooms = useRooms(branchId);
  const save = useSaveRoom();
  const [editing, setEditing] = useState<BranchRoom | 'new' | null>(null);
  const form = useForm<RoomValues>({ resolver: zodResolver(roomSchema), defaultValues: { nameEn: '', nameAr: '', kind: 'Consultation' } });
  const { errors } = form.formState;
  const kind = useWatch({ control: form.control, name: 'kind' });

  if (rooms.isPending) return <LoadingState />;
  if (rooms.isError) return <ErrorState onRetry={() => void rooms.refetch()} />;

  const open = (room: BranchRoom | 'new' | null) => {
    if (room) {
      form.reset(room === 'new' ? { nameEn: '', nameAr: '', kind: 'Consultation' } : { nameEn: room.nameEn, nameAr: room.nameAr, kind: room.kind });
      save.reset();
    }
    setEditing(room);
  };

  const submit = form.handleSubmit((values) => {
    const current = editing === 'new' ? undefined : editing ?? undefined;
    save.mutate({ branchId, roomId: current?.id, input: { ...values, isActive: current?.isActive ?? true } }, { onSuccess: () => setEditing(null) });
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => open('new')}>
          <Plus aria-hidden="true" />
          {t('rooms.add')}
        </Button>
      </div>
      {rooms.data.length === 0 ? (
        <EmptyState icon={<DoorOpen />} title={t('rooms.emptyTitle')} />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {rooms.data.map((room) => (
            <li key={room.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-3">
                <span className="text-label-md text-foreground">{nameIn(room, language)}</span>
                <StatusChip tone={KIND_TONE[room.kind]}>{t(`rooms.kinds.${room.kind}`)}</StatusChip>
              </span>
              <span className="flex items-center gap-2">
                <Switch
                  checked={room.isActive}
                  aria-label={t('rooms.inUse', { name: nameIn(room, language) })}
                  onCheckedChange={(checked) => save.mutate({ branchId, roomId: room.id, input: { nameEn: room.nameEn, nameAr: room.nameAr, kind: room.kind, isActive: checked } })}
                />
                <Button variant="ghost" size="icon-sm" aria-label={t('rooms.edit', { name: nameIn(room, language) })} onClick={() => open(room)}>
                  <Pencil aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(editing === 'new' ? 'rooms.addTitle' : 'rooms.editTitle')}</DialogTitle>
          </DialogHeader>
          <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
            {save.error && <FormAlert>{errorMessage(save.error)}</FormAlert>}
            <Field label={t('rooms.nameEn')} error={validation(errors.nameEn?.message, { max: 60 })} required>
              {(control) => <Input {...control} {...form.register('nameEn')} dir="ltr" />}
            </Field>
            <Field label={t('rooms.nameAr')} error={validation(errors.nameAr?.message, { max: 60 })} required>
              {(control) => <Input {...control} {...form.register('nameAr')} dir="rtl" />}
            </Field>
            <Field label={t('rooms.kind')} required>
              {(control) => (
                <Select value={kind} onValueChange={(value) => form.setValue('kind', value as RoomKind)}>
                  <SelectTrigger id={control.id} aria-describedby={control['aria-describedby']}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`rooms.kinds.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
