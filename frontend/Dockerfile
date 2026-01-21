# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Argumento para la URL de la API
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar template de nginx (no el .conf directamente)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copiar script de entrypoint personalizado
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Railway asigna PORT dinámicamente, local usa 80
ENV PORT=80

EXPOSE ${PORT}

# Usar nuestro entrypoint personalizado
ENTRYPOINT ["/docker-entrypoint.sh"]
