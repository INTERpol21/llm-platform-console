# Two-stage: build the SPA to static assets, then serve them from Caddy which
# also reverse-proxies /api to the BFF (see infra/Caddyfile).
FROM node:26-slim AS build
# See infra/bff.Dockerfile: Node 26 ships without corepack. Kept in step with
# `packageManager` in package.json.
RUN npm install -g pnpm@11.15.1
WORKDIR /app
# Manifests first, sources after: `COPY . .` before install meant EVERY source
# commit invalidated the pnpm install layer and CI rebuilt node_modules from
# scratch. This way the install layer only turns over when a manifest does.
# (.dockerignore excludes node_modules, so the later COPY cannot clobber it.)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/
COPY bff/package.json bff/
COPY web/package.json web/
# pnpm settings (strictDepBuilds, onlyBuiltDependencies) live in
# pnpm-workspace.yaml, which `kubb generate`'s own nested `pnpm install` reads
# too — a --config flag here would not reach it.
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @console/contracts generate \
  && pnpm --filter @console/web build

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/web/dist /srv
EXPOSE 80
