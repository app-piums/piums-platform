# Piums Gateway Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
