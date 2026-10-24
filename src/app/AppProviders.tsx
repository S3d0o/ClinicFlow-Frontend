import { useState, type ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/shared/i18n/use-language';
import { Toaster } from '@/shared/ui/sonner';
import { createQueryClient } from './query-client';
import type { Services } from './services';
import { ServicesProvider } from './ServicesProvider';

function LocalizedToaster() {
  const { direction } = useLanguage();
  return <Toaster position="top-center" dir={direction} />;
}

interface AppProvidersProps {
  services: Services;
  /** Tests pass their own client; the app creates one. */
  queryClient?: QueryClient;
  children: ReactNode;
}

/** Everything a screen relies on: the backend services, the server-state cache and toasts. */
export function AppProviders({ services, queryClient, children }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={client}>
        {children}
        <LocalizedToaster />
      </QueryClientProvider>
    </ServicesProvider>
  );
}
