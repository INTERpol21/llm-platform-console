import { defineConfig } from '@kubb/core';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';

// One config per backend spec: types + Zod land under src/<service>/, so the
// console imports @console/contracts/<service> and can never drift from the
// snapshot in openapi/. Regenerate with `pnpm contracts` after refreshing a spec.
function serviceConfig(name: 'gateway' | 'rag' | 'orchestrator') {
  return defineConfig({
    root: '.',
    input: { path: `./openapi/${name}.json` },
    output: {
      path: `./src/${name}`,
      clean: true,
      barrelType: 'named',
    },
    plugins: [
      pluginOas({ validate: false }),
      pluginTs({ output: { path: 'types' }, enumType: 'literal' }),
      pluginZod({ output: { path: 'zod' }, typed: true }),
    ],
  });
}

export default [serviceConfig('gateway'), serviceConfig('rag'), serviceConfig('orchestrator')];
