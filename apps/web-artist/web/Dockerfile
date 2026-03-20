# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY packages/ ./packages/
# Copy app package.json so pnpm installs its specific deps
RUN mkdir -p apps/web-artist/web
COPY apps/web-artist/web/package.json ./apps/web-artist/web/

# Install all workspace dependencies
RUN pnpm install --force

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy application source
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

# Build only the web-artist app (not the full monorepo)
WORKDIR /app/apps/web-artist/web
RUN pnpm build

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web-artist/web/public ./public
COPY --from=builder /app/apps/web-artist/web/.next/standalone ./
COPY --from=builder /app/apps/web-artist/web/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Set port environment variable
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
