# Multi-stage build para optimizar tamaño
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --no-frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar TypeScript si existe tsconfig.json
RUN if [ -f "tsconfig.json" ]; then pnpm run build 2>/dev/null || npm run build 2>/dev/null || echo "No build script found"; fi

# Generar Prisma Client si existe schema.prisma
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# ============================================================================
# Imagen final
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar dependencias y build desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma


# Variables de entorno por defecto
ENV NODE_ENV=production

# Exponer puerto
EXPOSE 4003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar
CMD ["sh", "-c", "if [ -f 'prisma/schema.prisma' ]; then npx prisma db push; fi && node dist/index.js"]
