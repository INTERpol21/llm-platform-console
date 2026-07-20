import * as Tooltip from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { initI18n } from '../shared/i18n/index.ts';

/** Render a subtree with the same cross-cutting providers the app uses. */
export function renderWithProviders(ui: ReactElement, language: 'en' | 'ru' = 'en') {
  const i18n = initI18n(language);
  void i18n.changeLanguage(language);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Tooltip.Provider>{children}</Tooltip.Provider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
