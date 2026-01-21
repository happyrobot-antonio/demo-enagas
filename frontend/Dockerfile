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

# Instalar gettext para envsubst
RUN apk add --no-cache gettext

# Copiar archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar template de nginx
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Nginx automáticamente procesará los templates en /etc/nginx/templates/
# y los pondrá en /etc/nginx/conf.d/ al iniciar

# Railway asigna PORT dinámicamente, local usa 80
ENV PORT=80

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
