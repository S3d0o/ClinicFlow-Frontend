import type { ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/shells/auth/AuthLayout';
import { BareLayout } from '@/shells/BareLayout';
import { PatientShell } from '@/shells/patient/PatientShell';
import { PublicLayout } from '@/shells/public/PublicLayout';
import { StaffShell } from '@/shells/staff/StaffShell';
import { TabletShell } from '@/shells/tablet/TabletShell';
import NotFoundPage from '../pages/NotFoundPage';
import { RouteGuard } from './RouteGuard';
import { ScreenElement } from './ScreenElement';
import { screenRoutes } from './index';
import type { Layout } from './types';

const LAYOUTS: { layout: Layout; Component: ComponentType; signedInOnly: boolean }[] = [
  { layout: 'public', Component: PublicLayout, signedInOnly: false },
  { layout: 'auth', Component: AuthLayout, signedInOnly: false },
  { layout: 'bare', Component: BareLayout, signedInOnly: false },
  // Workspaces need a user before their chrome renders; each screen then checks its permissions
  { layout: 'patient', Component: PatientShell, signedInOnly: true },
  { layout: 'staff', Component: StaffShell, signedInOnly: true },
  { layout: 'tablet', Component: TabletShell, signedInOnly: true },
];

/** Builds the route tree from the screen catalog: one layout route per frame, a guard per screen. */
export function AppRoutes() {
  return (
    <Routes>
      {LAYOUTS.map(({ layout, Component, signedInOnly }) => (
        <Route
          key={layout}
          element={
            signedInOnly ? (
              <RouteGuard access={{ kind: 'signed-in' }}>
                <Component />
              </RouteGuard>
            ) : (
              <Component />
            )
          }
        >
          {screenRoutes
            .filter((route) => route.layout === layout)
            .map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <RouteGuard access={route.access}>
                    <ScreenElement route={route} />
                  </RouteGuard>
                }
              />
            ))}
        </Route>
      ))}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
