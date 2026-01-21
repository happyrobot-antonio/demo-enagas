#!/bin/bash

# Script para detener los servicios GTS

echo "================================================"
echo "  Deteniendo Mesa de Servicios GTS"
echo "================================================"
echo ""

docker-compose down

echo ""
echo "✅ Servicios detenidos correctamente"
echo ""
