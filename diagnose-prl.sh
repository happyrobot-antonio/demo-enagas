#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA PRL"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Pedir URL de la API
read -p "📡 URL de tu API en Railway (ejemplo: https://api-production-xxx.up.railway.app): " API_URL

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Necesitas proporcionar la URL de la API${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Usando API: $API_URL${NC}"
echo ""

# Test 1: Verificar que la API responde
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  PROBANDO RUTA RAÍZ DE LA API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ROOT_RESPONSE=$(curl -s "$API_URL/")
echo "$ROOT_RESPONSE" | jq '.' 2>/dev/null

if echo "$ROOT_RESPONSE" | jq -e '.version' > /dev/null 2>&1; then
    VERSION=$(echo "$ROOT_RESPONSE" | jq -r '.version')
    PRL_AVAILABLE=$(echo "$ROOT_RESPONSE" | jq -r '.prl.available')
    echo ""
    echo -e "${GREEN}✅ API responde correctamente${NC}"
    echo -e "   Versión: ${GREEN}$VERSION${NC}"
    echo -e "   PRL disponible: ${GREEN}$PRL_AVAILABLE${NC}"
else
    echo ""
    echo -e "${RED}❌ La API no responde correctamente${NC}"
    echo -e "${YELLOW}Respuesta recibida:${NC}"
    echo "$ROOT_RESPONSE"
    echo ""
    echo -e "${YELLOW}Posibles causas:${NC}"
    echo "  • La URL de la API es incorrecta"
    echo "  • El servicio API no está desplegado en Railway"
    echo "  • Hay un error en el servidor"
    echo ""
    exit 1
fi

# Test 2: Verificar endpoint de turnos activos
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  PROBANDO /api/prl/shifts/active"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SHIFTS_RESPONSE=$(curl -s "$API_URL/api/prl/shifts/active")
echo "$SHIFTS_RESPONSE" | jq '.' 2>/dev/null

if echo "$SHIFTS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SHIFTS_COUNT=$(echo "$SHIFTS_RESPONSE" | jq '.shifts | length')
    echo ""
    if [ "$SHIFTS_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Turnos activos encontrados: $SHIFTS_COUNT${NC}"
        echo ""
        echo "$SHIFTS_RESPONSE" | jq -r '.shifts[] | "   🏭 \(.nombre) - \(.planta)"'
    else
        echo -e "${YELLOW}⚠️  No hay turnos activos hoy${NC}"
        echo ""
        echo -e "${YELLOW}Posibles causas:${NC}"
        echo "  • Los turnos en la BD tienen fechas incorrectas"
        echo "  • La tabla prl_shifts está vacía"
        echo "  • Necesitas ejecutar el script prl_seed.sql"
    fi
else
    echo ""
    echo -e "${RED}❌ Error al obtener turnos${NC}"
    echo -e "${YELLOW}Respuesta:${NC}"
    echo "$SHIFTS_RESPONSE"
    echo ""
    echo -e "${YELLOW}Posibles causas:${NC}"
    echo "  • Las tablas PRL no existen en la BD"
    echo "  • Necesitas ejecutar database/prl_schema.sql"
    echo "  • Hay un error en la query SQL"
fi

# Test 3: Verificar endpoint de trabajadores
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  PROBANDO /api/prl/workers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
WORKERS_RESPONSE=$(curl -s "$API_URL/api/prl/workers")
echo "$WORKERS_RESPONSE" | jq '.' 2>/dev/null

if echo "$WORKERS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    WORKERS_COUNT=$(echo "$WORKERS_RESPONSE" | jq '.workers | length')
    echo ""
    echo -e "${GREEN}✅ Trabajadores encontrados: $WORKERS_COUNT${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al obtener trabajadores${NC}"
fi

# Test 4: Verificar base de datos directamente
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  VERIFICANDO BASE DE DATOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "¿Quieres verificar la BD directamente? (necesitas la DATABASE_URL) [y/N]: " verify_db

if [[ $verify_db =~ ^[Yy]$ ]]; then
    read -p "DATABASE_URL: " DATABASE_URL
    
    if [ ! -z "$DATABASE_URL" ]; then
        echo ""
        echo "Contando turnos en la BD..."
        docker run --rm -i postgres:15-alpine psql "$DATABASE_URL" << 'EOF'
SELECT 
    COUNT(*) as total_turnos,
    COUNT(*) FILTER (WHERE estado = 'ACTIVO' AND fecha = CURRENT_DATE) as turnos_hoy,
    COUNT(*) FILTER (WHERE estado = 'ACTIVO' AND fecha > CURRENT_DATE) as turnos_futuros,
    COUNT(*) FILTER (WHERE estado = 'ACTIVO' AND fecha < CURRENT_DATE) as turnos_pasados
FROM prl_shifts;
EOF
        
        echo ""
        echo "Mostrando turnos activos de hoy..."
        docker run --rm -i postgres:15-alpine psql "$DATABASE_URL" << 'EOF'
SELECT nombre, planta, fecha, estado 
FROM prl_shifts 
WHERE estado = 'ACTIVO' AND fecha = CURRENT_DATE
ORDER BY nombre;
EOF
    fi
fi

# Resumen final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Próximos pasos según el resultado:${NC}"
echo ""
echo "Si la API no responde (Test 1 falló):"
echo "  1. Verifica la URL de la API en Railway"
echo "  2. Revisa los logs del servicio API en Railway"
echo "  3. Asegúrate de que el servicio está desplegado"
echo ""
echo "Si no hay turnos activos (Test 2 falló):"
echo "  1. Ejecuta: docker run --rm -i postgres:15-alpine psql \$DATABASE_URL < database/prl_schema.sql"
echo "  2. Ejecuta: docker run --rm -i postgres:15-alpine psql \$DATABASE_URL < database/prl_seed.sql"
echo "  3. Verifica que los turnos tengan la fecha de HOY"
echo ""
echo "Si todo funciona aquí pero no en el frontend:"
echo "  1. Verifica la variable VITE_API_URL en el servicio frontend de Railway"
echo "  2. Debe ser: $API_URL (sin barra final)"
echo "  3. Redesplega el frontend después de cambiar variables"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
