#!/bin/bash

echo "🔧 ARREGLAR FECHAS DE TURNOS PRL"
echo "================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

read -p "DATABASE_URL de Railway: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Necesitas proporcionar la DATABASE_URL${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Este script actualizará todos los turnos activos a HOY ($(date +%Y-%m-%d))${NC}"
read -p "¿Continuar? [y/N]: " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "Actualizando fechas..."
docker run --rm -i postgres:15-alpine psql "$DATABASE_URL" << 'EOF'
-- Actualizar todos los turnos activos a HOY
UPDATE prl_shifts 
SET fecha = CURRENT_DATE,
    updated_at = NOW()
WHERE estado = 'ACTIVO';

-- Mostrar resultado
SELECT id, nombre, planta, fecha, estado 
FROM prl_shifts 
WHERE estado = 'ACTIVO' AND fecha = CURRENT_DATE
ORDER BY nombre;
EOF

echo ""
echo -e "${GREEN}✅ Fechas actualizadas!${NC}"
echo ""
echo "Ahora recarga tu frontend:"
echo "  https://frontend-production-f6d9.up.railway.app/prl"
