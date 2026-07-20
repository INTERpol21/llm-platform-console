# BFF image. Context is the repo root so the pnpm workspace (contracts + bff)
# resolves. Runs the Hono server via tsx.
FROM node:26-slim
# Node 26 ships without corepack, so pnpm is installed directly. Pinned to the
# major the lockfile was written by — an unpinned `latest` would silently change
# the resolver between builds.
RUN npm install -g pnpm@11
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY bff ./bff
# strictDepBuilds=false: pnpm 11 turns "some dependency's build script was not
# run" into a hard install failure. The packages that need building are listed
# in pnpm-workspace.yaml (onlyBuiltDependencies) and do get built — the strict
# gate still fails the install over the ones we deliberately do not build.
# verifyDepsBeforeRun=false: node_modules is baked into the image, and pnpm's
# start-up check would re-verify the lockfile against the supply-chain policy at
# *runtime* — crash-looping the container whenever a dependency is newer than
# the release-age window. The check belongs in CI, not in a shipped image.
RUN pnpm config set verifyDepsBeforeRun false \
  && pnpm install --frozen-lockfile --config.strictDepBuilds=false

EXPOSE 8787
ENV BFF_PORT=8787
CMD ["pnpm", "--filter", "@console/bff", "start"]
