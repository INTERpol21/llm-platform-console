# BFF image. Context is the repo root so the pnpm workspace (contracts + bff)
# resolves. Runs the Hono server via tsx.
FROM node:26-slim
# Node 26 ships without corepack, so pnpm is installed directly. Exact version,
# matching `packageManager` in package.json: a floating `pnpm@11` would let the
# resolver change between builds of the same commit. npm itself is then removed:
# the runtime only ever invokes pnpm, and npm's vendored node_modules (tar et
# al.) is a recurring CVE source the image does not need to carry.
RUN npm install -g pnpm@11.15.1 \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app

# Manifests first, sources after: copying the full source trees before install
# meant every bff edit invalidated the pnpm install layer. web and contracts
# are deliberately absent — pnpm skips workspace members whose directory does
# not exist, and the BFF is a blind proxy that depends on neither.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY bff/package.json ./bff/
# verifyDepsBeforeRun=false: node_modules is baked into the image, so pnpm's
# start-up dependency check is pure overhead here — and it re-reads the lockfile
# at *runtime*, which can crash-loop the container on a policy it cannot fix.
# (strictDepBuilds lives in pnpm-workspace.yaml so CI and the image agree.)
RUN pnpm config set verifyDepsBeforeRun false \
  && pnpm install --frozen-lockfile
COPY bff ./bff

EXPOSE 8787
ENV BFF_PORT=8787
CMD ["pnpm", "--filter", "@console/bff", "start"]
