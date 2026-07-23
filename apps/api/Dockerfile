# ── Patorbit API — Dockerfile ─────────────────────────────────────────────
# Multi-stage build for production deployment
# Uses pnpm workspaces monorepo

# ── Stage 1: Install build dependencies ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# ── Stage 2: Install all dependencies (dev + prod) ──
FROM base AS deps
WORKDIR /app

# Copy root workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json .npmrc ./

# Copy all package.json files for workspace discovery
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY packages/storage/package.json packages/storage/
COPY packages/utils/package.json packages/utils/
COPY packages/types/package.json packages/types/
COPY packages/tooling/package.json packages/tooling/ 2>/dev/null || true
COPY packages/tsconfig/package.json packages/tsconfig/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --prefer-offline

# ── Stage 3: Build shared packages ──
FROM deps AS builder
WORKDIR /app

# Copy source code for all workspace packages that the API depends on
COPY packages/database/ packages/database/
COPY packages/config/ packages/config/
COPY packages/auth/ packages/auth/
COPY packages/storage/ packages/storage/
COPY packages/utils/ packages/utils/
COPY packages/types/ packages/types/
COPY packages/tsconfig/ packages/tsconfig/

# Build shared packages (in dependency order)
RUN pnpm --filter @patorbit/tsconfig build 2>/dev/null || true
RUN pnpm --filter @patorbit/config build
RUN pnpm --filter @patorbit/types build 2>/dev/null || true
RUN pnpm --filter @patorbit/utils build 2>/dev/null || true
RUN pnpm --filter @patorbit/database build
RUN pnpm --filter @patorbit/auth build 2>/dev/null || true
RUN pnpm --filter @patorbit/storage build 2>/dev/null || true

# Copy and build API
COPY apps/api/ apps/api/
RUN pnpm --filter @patorbit/api build

# ── Stage 4: Prune to production dependencies ──
FROM base AS prod-deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY packages/storage/package.json packages/storage/
COPY packages/utils/package.json packages/utils/
COPY packages/types/package.json packages/types/
COPY packages/tsconfig/package.json packages/tsconfig/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prefer-offline --prod

# ── Stage 5: Production image ──
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/packages/storage/node_modules ./packages/storage/node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/packages/utils/node_modules ./packages/utils/node_modules

# Copy built shared packages
COPY --from=builder --chown=appuser:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=appuser:nodejs /app/packages/config/dist ./packages/config/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/storage/dist ./packages/storage/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/types/dist ./packages/types/dist

# Copy built API app and its node_modules (pruned)
COPY --from=builder --chown=appuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=prod-deps --chown=appuser:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy Prisma schema for runtime migrations
COPY --from=builder --chown=appuser:nodejs /app/packages/database/prisma ./packages/database/prisma

# Ensure Prisma client is generated (needed in production)
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

USER appuser
EXPOSE 4000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "apps/api/dist/main"]
