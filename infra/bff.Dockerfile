# BFF image. Context is the repo root so the pnpm workspace (contracts + bff)
# resolves. Runs the Hono server via tsx.
FROM node:26-slim
# Node 26 ships without corepack, so pnpm is installed directly. Exact version,
# matching `packageManager` in package.json: a floating `pnpm@11` would let the
# resolver change between builds of the same commit.
RUN npm install -g pnpm@11.15.1
WORKDIR /app

# Manifests first, sources after: copying the full source trees before install
# meant every bff/contracts edit invalidated the pnpm install layer. web is
# deliberately absent — pnpm skips workspace members whose directory does not
# exist, and this image must not carry the SPA's dependency tree.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY bff/package.json ./bff/
# verifyDepsBeforeRun=false: node_modules is baked into the image, so pnpm's
# start-up dependency check is pure overhead here — and it re-reads the lockfile
# at *runtime*, which can crash-loop the container on a policy it cannot fix.
# (strictDepBuilds lives in pnpm-workspace.yaml so CI and the image agree.)
RUN pnpm config set verifyDepsBeforeRun false \
  && pnpm install --frozen-lockfile
COPY packages/contracts ./packages/contracts
COPY bff ./bff

EXPOSE 8787
ENV BFF_PORT=8787
CMD ["pnpm", "--filter", "@console/bff", "start"]
