#!/bin/bash

# Script de inicio rápido para el sistema GTS
# Mesa de Servicios - Dashboard en Tiempo Real

echo "================================================"
echo "  Mesa de Servicios GTS - Enagás"
echo "  Dashboard en Tiempo Real"
echo "================================================"
echo ""

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

echo "✓ Docker está instalado"
echo "✓ Docker Compose está instalado"
echo ""

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Archivo .env creado"
    else
        echo "⚠️  .env.example no encontrado, usando valores por defecto"
    fi
fi

echo ""
echo "🚀 Iniciando servicios con Docker Compose..."
echo ""

# Detener contenedores existentes si los hay
docker-compose down 2>/dev/null

# Construir e iniciar servicios
docker-compose up -d --build

# Esperar a que los servicios estén listos
echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "================================================"
echo "✅ Sistema iniciado correctamente"
echo "================================================"
echo ""
echo "📱 Accede a las siguientes URLs:"
echo ""
echo "  🌐 Dashboard:     http://localhost:5173"
echo "  🔌 API:           http://localhost:3000"
echo "  ❤️  Health Check:  http://localhost:3000/health"
echo "  🗄️  PostgreSQL:    localhost:5432"
echo ""
echo "================================================"
echo ""
echo "📝 Comandos útiles:"
echo ""
echo "  Ver logs:           docker-compose logs -f"
echo "  Detener servicios:  docker-compose down"
echo "  Reiniciar:          docker-compose restart"
echo ""
echo "================================================"
