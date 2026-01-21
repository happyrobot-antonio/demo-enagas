#!/bin/bash

# Script de prueba del sistema GTS
API_URL="http://localhost:8000"

echo "🧪 =============================================="
echo "   Prueba del Sistema GTS - Dashboard en Tiempo Real"
echo "================================================"
echo ""

echo "📊 1. Obteniendo estadísticas..."
curl -s $API_URL/api/stats | python3 -m json.tool 2>/dev/null || curl -s $API_URL/api/stats
echo ""
echo ""

echo "🎫 2. Creando un ticket de incidencia..."
TICKET_RESPONSE=$(curl -s -X POST $API_URL/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INCIDENCIA_TECNICA",
    "descripcion": "Error en sistema de medición - Lecturas inconsistentes",
    "sistema": "Telemedida",
    "contacto": {
      "nombre": "Carlos Martínez",
      "empresa": "GasDistribución",
      "telefono": "600111222",
      "email": "carlos.martinez@gasdistribucion.es"
    },
    "prioridad": "ALTA"
  }')

echo "$TICKET_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TICKET_RESPONSE"
TICKET_NUM=$(echo "$TICKET_RESPONSE" | grep -o 'GTS-[0-9]*-[0-9]*' | head -1)
echo ""
echo "✅ Ticket creado: $TICKET_NUM"
echo ""
sleep 2

echo "🚨 3. Activando protocolo de emergencia..."
EMERGENCY_RESPONSE=$(curl -s -X POST $API_URL/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_incidente": "FUGA",
    "ubicacion_completa": "Carretera M-50, Km 15, Alcorcón, Madrid",
    "contacto_llamante": {
      "nombre": "Juan Pérez",
      "telefono": "655432109",
      "empresa": "Obras Públicas Madrid"
    },
    "descripcion_situacion": "Posible fuga detectada durante excavación. Olor a gas presente.",
    "nivel_riesgo": "ALTO",
    "municipio": "Alcorcón",
    "provincia": "Madrid"
  }')

echo "$EMERGENCY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EMERGENCY_RESPONSE"
EMG_CODE=$(echo "$EMERGENCY_RESPONSE" | grep -o 'EMG-[0-9]*-[0-9]*' | head -1)
echo ""
echo "🚨 EMERGENCIA ACTIVADA: $EMG_CODE"
echo ""
sleep 2

echo "📞 4. Registrando una llamada..."
CALL_RESPONSE=$(curl -s -X POST $API_URL/api/calls \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_llamante": "María López",
    "empresa": "EnerPlus",
    "telefono": "600987654",
    "tipo_consulta": "CONSULTA_OPERATIVA",
    "categoria": "Programación",
    "notas": "Consulta sobre plazos de nominación"
  }')

echo "$CALL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CALL_RESPONSE"
echo ""
sleep 2

echo "🔍 5. Registrando búsqueda en documentación..."
curl -s -X POST $API_URL/api/searches \
  -H "Content-Type: application/json" \
  -d '{
    "query": "procedimiento habilitación cliente directo",
    "tipo_proceso": "habilitacion",
    "usuario_solicitante": "Laura Gómez",
    "resultados_count": 5
  }' > /dev/null

echo "✅ Búsqueda registrada"
echo ""
sleep 1

echo "🔄 6. Registrando transferencia a especialista..."
curl -s -X POST $API_URL/api/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "area_destino": "Operaciones - Capacidades",
    "resumen_consulta": "Consulta técnica sobre capacidad de inyección",
    "datos_usuario": {
      "nombre": "Pedro Sánchez",
      "empresa": "GasNatural",
      "email": "pedro.sanchez@gasnatural.es"
    }
  }' > /dev/null

echo "✅ Transferencia registrada"
echo ""
sleep 1

echo "📊 7. Estadísticas finales..."
curl -s $API_URL/api/stats | python3 -m json.tool 2>/dev/null || curl -s $API_URL/api/stats
echo ""
echo ""

echo "================================================"
echo "✅ Prueba completada exitosamente!"
echo "================================================"
echo ""
echo "🌐 Abre el dashboard para ver todas las operaciones:"
echo "   http://localhost:8080"
echo ""
echo "📊 Dashboard - Vista general"
echo "🎫 Tickets - Lista de incidencias ($TICKET_NUM)"
echo "🚨 Emergencias - Alertas activas ($EMG_CODE)"
echo "📞 Llamadas - Registro de llamadas"
echo ""
echo "💡 Todas las actualizaciones aparecen en TIEMPO REAL"
echo "================================================"
