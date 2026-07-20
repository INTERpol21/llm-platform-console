# BFF image. Context is the repo root so the pnpm workspace (contracts + bff)
# resolves. Runs the Hono server via tsx.
FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY bff ./bff
RUN pnpm install --frozen-lockfile

EXPOSE 8787
ENV BFF_PORT=8787
CMD ["pnpm", "--filter", "@console/bff", "start"]
