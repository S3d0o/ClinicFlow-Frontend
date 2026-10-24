import type { ComponentType, LazyExoticComponent } from 'react';
import type { Permission, Scope } from '@/features/auth/model/permissions';
import type enScreens from '@/shared/i18n/locales/en/screens.json';

/** The frame a screen renders in (see src/shells). */
export type Layout = 'public' | 'auth' | 'patient' | 'staff' | 'tablet' | 'bare';

/** Who may open a screen. Staff screens check permissions, never role names (ADR 0002). */
export type Access =
  | { kind: 'public' }
  | { kind: 'guest' } // signed-out visitors; signed-in users are sent to their home page
  | { kind: 'signed-in' }
  | { kind: 'patient' } // the patient capacity of an account (02 §3)
  | { kind: 'applicant' }
  /** One of `anyOf`, held at `minScope` or wider (default: any scope, including Own). */
  | { kind: 'permission'; anyOf: Permission[]; minScope?: Scope };

export type ScreenKey = keyof typeof enScreens;

export interface ScreenRoute {
  path: string;
  /** Title key in the `screens` namespace (page title and document title). */
  screen: ScreenKey;
  layout: Layout;
  access: Access;
  /** The frontend phase that builds the screen (see design-v2/README.md). */
  phase: number;
  /** The Stitch design it follows, under design-v2/screens/. */
  design?: string;
  /** The page, once built. Until then the route shows a "coming in phase N" placeholder. */
  component?: LazyExoticComponent<ComponentType>;
}
