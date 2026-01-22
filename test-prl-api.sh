#!/bin/bash

echo "🧪 Probando rutas PRL en la API..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URL de la API (cambiar según necesidad)
API_URL="${1:-http://localhost:3000}"

echo "📡 Usando API: $API_URL"
echo ""

# Test 1: Verificar ruta raíz
echo "1️⃣ Testeando ruta raíz..."
curl -s "$API_URL/" | jq -r '.prl // empty' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Ruta raíz responde${NC}"
    curl -s "$API_URL/" | jq '.prl'
else
    echo -e "${RED}❌ Error en ruta raíz${NC}"
fi
echo ""

# Test 2: Shifts activos
echo "2️⃣ Testeando /api/prl/shifts/active..."
SHIFTS=$(curl -s "$API_URL/api/prl/shifts/active")
if echo "$SHIFTS" | jq -e '.success' > /dev/null 2>&1; then
    COUNT=$(echo "$SHIFTS" | jq '.shifts | length')
    echo -e "${GREEN}✅ Turnos activos: $COUNT${NC}"
    echo "$SHIFTS" | jq '.shifts[] | {nombre, planta, fecha}'
else
    echo -e "${RED}❌ Error obteniendo turnos${NC}"
    echo "$SHIFTS"
fi
echo ""

# Test 3: Workers
echo "3️⃣ Testeando /api/prl/workers..."
WORKERS=$(curl -s "$API_URL/api/prl/workers")
if echo "$WORKERS" | jq -e '.success' > /dev/null 2>&1; then
    COUNT=$(echo "$WORKERS" | jq '.workers | length')
    echo -e "${GREEN}✅ Trabajadores encontrados: $COUNT${NC}"
    echo "$WORKERS" | jq '.workers[] | {nombre_completo, tipo_trabajo, checklist_estado}'
else
    echo -e "${RED}❌ Error obteniendo trabajadores${NC}"
    echo "$WORKERS"
fi
echo ""

echo "🏁 Pruebas completadas"
