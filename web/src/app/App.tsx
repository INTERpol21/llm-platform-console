import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from './providers/index.ts';
import { router } from './router/index.ts';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
