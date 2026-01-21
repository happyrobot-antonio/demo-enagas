#!/bin/sh
set -e

# Sustituir la variable PORT en nginx.conf
# Si PORT no está definido, usa 80 (para local)
export PORT=${PORT:-80}

echo "🔧 Configurando Nginx para escuchar en puerto: $PORT"

# Generar nginx.conf desde el template
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "✅ Nginx configurado correctamente"
cat /etc/nginx/conf.d/default.conf

# Ejecutar nginx
exec nginx -g 'daemon off;'
