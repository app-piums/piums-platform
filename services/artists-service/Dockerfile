# Multi-stage build para optimizar tamaño
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Generar Prisma Client antes de compilar TypeScript
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# Compilar TypeScript
RUN npm run build

# ============================================================================
# Imagen final
# ============================================================================
FROM node:20-alpine

WORKDIR /app

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
USER node
CMD ["sh", "-c", "if [ -f 'prisma/migrations' ]; then npx prisma migrate deploy; elif [ -f 'prisma/schema.prisma' ]; then npx prisma db push; fi && node dist/index.js"]
