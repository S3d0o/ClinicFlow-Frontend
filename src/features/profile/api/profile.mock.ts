import { findByPhone, sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import type { PatientRecordSeed } from '@/mocks/seed/patient-portal';
import type { UserSeed } from '@/mocks/seed/users';
import { ServiceError } from '@/shared/api/service-error';
import { toE164EgyptianMobile } from '@/shared/lib/phone';
import { channelAllowed, type PatientProfile } from '../model/profile';
import type { ProfileService } from './profile.service';

export function createMockProfileService(deps: AuthMockDeps): ProfileService {
  const { db, otp, latencyMs, now } = deps;

  /** The patient record, created on first use for patients who signed up in the browser. */
  const recordOf = (user: UserSeed): PatientRecordSeed => {
    let record = db.patients.find((p) => p.userId === user.id);
    if (!record) {
      record = {
        userId: user.id,
        mrn: `MRN-${String(1000 + db.patients.length).padStart(6, '0')}`,
        memberSince: now().toISOString().slice(0, 10),
        allergies: [],
        conditions: [],
        notificationChannel: user.emailConfirmed ? 'Both' : 'Sms', // FR-NTF-04 default
      };
      db.patients.push(record);
    }
    return record;
  };

  const profileOf = (user: UserSeed): PatientProfile => {
    const record = recordOf(user);
    return structuredClone({
      fullName: user.fullName,
      mrn: record.mrn,
      memberSince: record.memberSince,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      email: user.email,
      emailConfirmed: user.emailConfirmed,
      notificationChannel: record.notificationChannel,
      preferredLanguage: user.preferredLanguage,
      bloodType: record.bloodType,
      allergies: record.allergies,
      conditions: record.conditions,
    });
  };

  return {
    async getMine() {
      await delay(latencyMs);
      return profileOf(sessionUser(deps));
    },

    async updatePreferences({ notificationChannel, preferredLanguage }) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      if (notificationChannel) {
        if (!channelAllowed(notificationChannel, user.emailConfirmed)) throw new ServiceError('Profile.EmailRequired');
        recordOf(user).notificationChannel = notificationChannel;
      }
      if (preferredLanguage) user.preferredLanguage = preferredLanguage;
      return profileOf(user);
    },

    async requestPhoneChange(newPhone) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      const e164 = toE164EgyptianMobile(newPhone);
      if (!e164) throw new ServiceError('Validation.InvalidPhone');
      const owner = findByPhone(db, e164);
      if (owner && owner.id !== user.id) throw new ServiceError('Auth.PhoneAlreadyUsed');
      return otp.send(e164, 'ChangePhone');
    },

    async confirmPhoneChange(newPhone, code) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      const e164 = toE164EgyptianMobile(newPhone);
      if (!e164) throw new ServiceError('Validation.InvalidPhone');
      otp.verify(e164, 'ChangePhone', code, { consume: true });
      user.phone = e164;
      user.phoneVerified = true;
      return profileOf(user);
    },

    async changePassword(currentPassword, newPassword) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      if (currentPassword !== user.password) throw new ServiceError('Auth.InvalidCredentials');
      user.password = newPassword;
    },
  };
}
