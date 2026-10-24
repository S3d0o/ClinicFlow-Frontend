import type { CurrentUser, Role } from '../model/user';

export interface SignInRequest {
  /** A phone number or an email address (FR-ACC-03). */
  identifier: string;
  password: string;
}

/** Staff accounts need a second step (FR-STF-07); patients and applicants are signed in directly. */
export type SignInResult =
  | { status: 'signed-in'; user: CurrentUser }
  | { status: 'mfa-required'; challengeId: string };

/** Sign-in and session (port). Implemented by the mock adapter now and the `/api/v2/auth` adapter later. */
export interface AuthService {
  getCurrentUser(): Promise<CurrentUser | null>;
  signIn(request: SignInRequest): Promise<SignInResult>;
  verifyMfa(challengeId: string, code: string): Promise<CurrentUser>;
  signOut(): Promise<void>;
}

/** A sample account offered on the demo sign-in screen. Only the mock backend provides these. */
export interface DemoAccount {
  userId: string;
  fullName: string;
  roleLabel: Role | 'Applicant';
  identifier: string;
}

export interface DemoAccounts {
  accounts: DemoAccount[];
  /** The password every demo account uses. */
  password: string;
  /** The code every demo SMS or authenticator "sends". */
  code: string;
}

export interface DemoAccountsService {
  list(): Promise<DemoAccounts>;
  /** Signs in as the account directly, skipping the password and two-step code. */
  signInAs(userId: string): Promise<CurrentUser>;
}
