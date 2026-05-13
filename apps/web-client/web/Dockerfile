FROM node:20-alpine

RUN npm install -g pnpm@8

WORKDIR /app

# Copiar todo el monorepo
COPY . .

# Instalar dependencias
RUN pnpm install --force

# Construir la aplicación
ARG GATEWAY_INTERNAL_URL=http://gateway:3000
ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyChoNjHVlq3iW3lWfoa9iObrQmFOLgRvPo
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=piums-artista.firebaseapp.com
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=piums-artista
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=piums-artista.firebasestorage.app
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=967320828042
ARG NEXT_PUBLIC_FIREBASE_APP_ID=1:967320828042:web:ab90c17f49a99feb5a1573
ENV NODE_ENV=production
ENV DOCKER_BUILD=1
ENV GATEWAY_INTERNAL_URL=${GATEWAY_INTERNAL_URL}
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
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
