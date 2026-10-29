import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Send, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import type { RoleAssignment } from '@/features/auth/model/user';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { useInviteStaff } from '../hooks/use-staff';
import { grantableRoles, inviteSchema, rolesProblem, type InviteValues } from '../model/staff';
import { RoleScopeEditor } from './RoleScopeEditor';

interface InviteStaffSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Invites a staff member with their roles and branches (FR-STF-01; design admin/02). */
export function InviteStaffSheet({ open, onOpenChange }: InviteStaffSheetProps) {
  const { t } = useTranslation(['staff', 'common']);
  const { direction } = useLanguage();
  const { user } = useSession();
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const invite = useInviteStaff();
  const form = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { fullName: '', email: '' } });
  const [roles, setRoles] = useState<RoleAssignment[]>([]);
  const [rolesTouched, setRolesTouched] = useState(false);
  const { errors } = form.formState;
  const problem = rolesProblem(roles);

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      setRoles([]);
      setRolesTouched(false);
      invite.reset();
    }
    onOpenChange(next);
  };

  const submit = form.handleSubmit(
    async (values) => {
      setRolesTouched(true);
      if (problem) return;
      try {
        const member = await invite.mutateAsync({ ...values, roles });
        toast.success(t('invite.sent', { email: member.email }));
        close(false);
      } catch {
        // Shown from invite.error below
      }
    },
    () => setRolesTouched(true)
  );

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side={direction === 'rtl' ? 'left' : 'right'} className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="flex items-center gap-2 font-display text-headline-md text-ink">
            <UserPlus aria-hidden="true" className="size-5 text-primary" />
            {t('invite.title')}
          </SheetTitle>
          <SheetDescription>{t('invite.description')}</SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-5 p-6">
            {invite.error && <FormAlert>{errorMessage(invite.error)}</FormAlert>}
            <Field label={t('invite.fullName')} error={validation(errors.fullName?.message, { max: 100 })} required>
              {(control) => <Input {...control} {...form.register('fullName')} dir="auto" autoComplete="off" />}
            </Field>
            <Field label={t('invite.email')} hint={t('invite.emailHint')} error={validation(errors.email?.message)} required>
              {(control) => <Input {...control} {...form.register('email')} type="email" dir="ltr" autoComplete="off" />}
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-label-md">
                {t('roles.title')}
                <span aria-hidden="true" className="text-destructive">*</span>
              </legend>
              <RoleScopeEditor value={roles} onChange={setRoles} grantable={user ? grantableRoles(user) : []} idPrefix="invite-role" />
              {rolesTouched && problem && <p className="text-body-sm text-destructive">{t(`roles.errors.${problem}`)}</p>}
            </fieldset>
            <p className="flex gap-2 rounded-xl border border-info/30 bg-info/10 p-3 text-body-sm text-foreground">
              <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
              {t('invite.validity')}
            </p>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-4">
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              <Send aria-hidden="true" className="rtl-flip" />
              {t('invite.send')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
