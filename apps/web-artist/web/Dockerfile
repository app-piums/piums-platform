FROM node:20-alpine

RUN npm install -g pnpm@8

WORKDIR /app

# Copiar todo el monorepo
COPY . .

# Instalar dependencias
RUN pnpm install --force

# Construir la aplicación
ARG GATEWAY_INTERNAL_URL=http://gateway:3000
ENV NODE_ENV=production
ENV GATEWAY_INTERNAL_URL=${GATEWAY_INTERNAL_URL}
RUN pnpm --filter web-artist build

# Preparar el directorio de ejecución
WORKDIR /app/apps/web-artist/web/.next/standalone

# Copiar archivos estáticos necesarios para standalone
RUN cp -r ../static ./apps/web-artist/web/.next/static
RUN cp -r ../../public ./apps/web-artist/web/public

# Exponer puerto
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Iniciar la aplicación desde el directorio standalone
CMD ["node", "apps/web-artist/web/server.js"]
