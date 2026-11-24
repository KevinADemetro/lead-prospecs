FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY apps/backend ./apps/backend
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @app/shared build \
  && pnpm --filter @app/backend exec prisma generate \
  && pnpm --filter @app/backend build

FROM node:22-bookworm-slim AS production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --create-home --uid 1001 appuser
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=appuser:appuser /app/package.json /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/packages ./packages
COPY --from=build --chown=appuser:appuser /app/apps/backend ./apps/backend
COPY --chown=appuser:appuser docker/backend-entrypoint.sh /app/backend-entrypoint.sh
RUN chmod +x /app/backend-entrypoint.sh
USER appuser
WORKDIR /app/apps/backend
ENV PATH="/app/apps/backend/node_modules/.bin:/app/node_modules/.bin:${PATH}"
EXPOSE 3001
HEALTHCHECK --interval=20s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/backend-entrypoint.sh"]
