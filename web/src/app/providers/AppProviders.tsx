import * as Tooltip from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { initI18n } from '../../shared/i18n/index.ts';

const i18nInstance = initI18n();

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  });
}

export interface AppProvidersProps {
  children: ReactNode;
}

/** Cross-cutting providers: React Query, i18n, and Radix tooltip context. */
export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
