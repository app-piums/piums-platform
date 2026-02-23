# Piums Auth Service Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto
EXPOSE 4001

# Comando para iniciar (con migración automática en dev)
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
