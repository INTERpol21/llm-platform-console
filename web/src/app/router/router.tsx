import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { KnowledgePage } from '../../pages/knowledge/index.ts';
import { ModelsPage } from '../../pages/models/index.ts';
import { ResearchPage } from '../../pages/research/index.ts';
import { UsagePage } from '../../pages/usage/index.ts';
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

const usageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/usage',
  component: UsagePage,
});

const knowledgeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/knowledge',
  component: KnowledgePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  modelsRoute,
  researchRoute,
  usageRoute,
  knowledgeRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
