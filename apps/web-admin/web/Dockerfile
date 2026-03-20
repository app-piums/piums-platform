# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps

RUN npm install -g pnpm@8

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY packages/ ./packages/

RUN pnpm install --force

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

RUN npm install -g pnpm@8

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

# Build only the web-admin app (not the full monorepo)
WORKDIR /app/apps/web-admin/web
RUN pnpm build

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web-admin/web/public ./public
COPY --from=builder /app/apps/web-admin/web/.next/standalone ./
COPY --from=builder /app/apps/web-admin/web/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
