# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar pnpm y dependencias
RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN if [ -f "tsconfig.json" ]; then pnpm run build 2>/dev/null || npm run build 2>/dev/null || echo "No build script found"; fi

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar dependencias y build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Copiar código fuente para hot-reload en development
COPY . .

ENV NODE_ENV=production

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Comando para iniciar
CMD ["node", "dist/index.js"]
