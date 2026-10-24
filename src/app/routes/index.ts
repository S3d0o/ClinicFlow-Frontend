import { patientRoutes } from './catalog/patient.routes';
import { publicRoutes } from './catalog/public.routes';
import {
  adminRoutes,
  deskRoutes,
  doctorRoutes,
  financeRoutes,
  managerRoutes,
  sharedStaffRoutes,
} from './catalog/staff.routes';
import type { ScreenRoute } from './types';

/** Every screen of the app. Menus and guards read access rules from here, so they never disagree. */
export const screenRoutes: ScreenRoute[] = [
  ...publicRoutes,
  ...patientRoutes,
  ...deskRoutes,
  ...doctorRoutes,
  ...managerRoutes,
  ...adminRoutes,
  ...financeRoutes,
  ...sharedStaffRoutes,
];

const byPath = new Map(screenRoutes.map((route) => [route.path, route]));

/** The screen registered at exactly `path` (menus link to static paths only). */
export function routeAt(path: string): ScreenRoute {
  const route = byPath.get(path);
  if (!route) throw new Error(`No screen is registered at ${path}`);
  return route;
}
