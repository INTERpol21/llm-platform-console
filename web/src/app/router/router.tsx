import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { ModelsPage } from '../../pages/models/index.ts';
import { ResearchPage } from '../../pages/research/index.ts';
import { RootLayout } from './RootLayout.tsx';

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/models' });
  },
});

const modelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/models',
  component: ModelsPage,
});

const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/research',
  component: ResearchPage,
});

const routeTree = rootRoute.addChildren([indexRoute, modelsRoute, researchRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
