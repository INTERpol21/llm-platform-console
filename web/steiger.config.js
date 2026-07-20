import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Test harness and co-located tests are not FSD units.
    ignores: ['**/*.test.ts', '**/*.test.tsx', './src/test/**'],
  },
  {
    // Shared is a segment-only layer; its per-component folders expose their own index.
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
  {
    // Advisory (non-boundary) rules that don't fit a compact, single-consumer console:
    //  - insignificant-slice: every widget/feature here has exactly one caller by design;
    //  - inconsistent-naming: entity slice names ("models", "research") are intentional;
    //  - segments-by-purpose: `app/providers` is the conventional app-layer segment name
    //    (the app layer is initialization, not standard purpose-named segments).
    // All import-direction / public-API boundary rules remain enabled.
    rules: {
      'fsd/insignificant-slice': 'off',
      'fsd/inconsistent-naming': 'off',
      'fsd/segments-by-purpose': 'off',
    },
  },
]);
