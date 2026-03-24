FROM node:20-alpine

RUN npm install -g pnpm@8

WORKDIR /app

# Copiar todo el monorepo
COPY . .

# Instalar dependencias
RUN pnpm install --force

# Construir la aplicación
ENV NODE_ENV=production
RUN pnpm --filter web-client build

# Preparar el directorio de ejecución
WORKDIR /app/apps/web-client/web/.next/standalone

# Copiar archivos estáticos necesarios para standalone
RUN cp -r ../static ./apps/web-client/web/.next/static
RUN cp -r ../../public ./apps/web-client/web/public

# Exponer puerto (web-client usa 3000)
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Iniciar la aplicación desde el directorio standalone
CMD ["node", "apps/web-client/web/server.js"]
