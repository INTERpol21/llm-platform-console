# Two-stage: build the SPA to static assets, then serve them from Caddy which
# also reverse-proxies /api to the BFF (see infra/Caddyfile).
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @console/contracts generate \
  && pnpm --filter @console/web build

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/web/dist /srv
EXPOSE 80
