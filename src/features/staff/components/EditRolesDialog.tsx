import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import type { RoleAssignment } from '@/features/auth/model/user';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { FormAlert } from '@/shared/ui/FormAlert';
import { useSetStaffRoles } from '../hooks/use-staff';
import { grantableRoles, rolesProblem, type StaffMember } from '../model/staff';
import { RoleScopeEditor } from './RoleScopeEditor';

interface EditRolesDialogProps {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Changes a member's roles and branches; they apply at the member's next token refresh (FR-STF-03). */
export function EditRolesDialog({ member, open, onOpenChange }: EditRolesDialogProps) {
  const { t } = useTranslation(['staff', 'common']);
  const { user } = useSession();
  const errorMessage = useErrorMessage();
  const save = useSetStaffRoles();
  const [roles, setRoles] = useState<RoleAssignment[]>(member.roles);
  const problem = rolesProblem(roles);

  const change = (next: boolean) => {
    if (next) setRoles(member.roles);
    else save.reset();
    onOpenChange(next);
  };

  const submit = () =>
    save.mutate(
      { staffId: member.id, roles },
      {
        onSuccess: () => {
          toast.success(t('roles.saved'));
          onOpenChange(false);
        },
      }
    );

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('roles.editTitle', { name: member.fullName })}</DialogTitle>
          <DialogDescription>{t('roles.editHint')}</DialogDescription>
        </DialogHeader>
        {save.error && <FormAlert>{errorMessage(save.error)}</FormAlert>}
        <RoleScopeEditor value={roles} onChange={setRoles} grantable={user ? grantableRoles(user) : []} idPrefix="edit-role" />
        {problem && <p className="text-body-sm text-destructive">{t(`roles.errors.${problem}`)}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => change(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button disabled={!!problem || save.isPending} onClick={submit}>
            {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
