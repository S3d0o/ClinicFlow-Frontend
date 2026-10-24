import { useState, type ReactNode } from 'react';
import { DirectionProvider } from '@radix-ui/react-direction';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/shared/i18n/use-language';
import { Toaster } from '@/shared/ui/sonner';
import { createQueryClient } from './query-client';
import type { Services } from './services';
import { ServicesProvider } from './ServicesProvider';

/** Radix primitives (tabs, menus, selects) default to left-to-right without this. */
function LocalizedDirection({ children }: { children: ReactNode }) {
  const { direction } = useLanguage();
  return (
    <DirectionProvider dir={direction}>
      {children}
      <Toaster position="top-center" dir={direction} />
    </DirectionProvider>
  );
}

interface AppProvidersProps {
  services: Services;
  /** Tests pass their own client; the app creates one. */
  queryClient?: QueryClient;
  children: ReactNode;
}

/** Everything a screen relies on: the backend services, the server-state cache, the text direction and toasts. */
export function AppProviders({ services, queryClient, children }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={client}>
        <LocalizedDirection>{children}</LocalizedDirection>
      </QueryClientProvider>
    </ServicesProvider>
  );
}
