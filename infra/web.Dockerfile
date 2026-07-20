# Two-stage: build the SPA to static assets, then serve them from Caddy which
# also reverse-proxies /api to the BFF (see infra/Caddyfile).
FROM node:26-slim AS build
# See infra/bff.Dockerfile: Node 26 ships without corepack.
RUN npm install -g pnpm@11
WORKDIR /app
COPY . .
# pnpm settings (strictDepBuilds, onlyBuiltDependencies) live in
# pnpm-workspace.yaml, which `kubb generate`'s own nested `pnpm install` reads
# too — a --config flag here would not reach it.
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @console/contracts generate \
  && pnpm --filter @console/web build

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/web/dist /srv
EXPOSE 80
