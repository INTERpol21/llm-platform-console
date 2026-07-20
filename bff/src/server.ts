/**
 * Process entry point: build the app from environment config and serve it over
 * @hono/node-server. Importable side-effect-free logic lives in ./app.ts.
 */

import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { config } from './config.ts';

const app = createApp(config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  // Log the port and backend origins — never the injected keys.
  console.log(`[bff] listening on :${info.port}`);
  console.log(
    `[bff] proxying gateway=${config.gateway.url} rag=${config.rag.url} orchestrator=${config.orch.url}`,
  );
});
