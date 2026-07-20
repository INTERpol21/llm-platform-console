// Namespaced re-exports so same-named schemas across services (e.g.
// HTTPValidationError) don't collide. Prefer the subpath imports
// (`@console/contracts/gateway`) in app code; this barrel is for tooling.
export * as gateway from './gateway/index.ts';
export * as rag from './rag/index.ts';
export * as orchestrator from './orchestrator/index.ts';
