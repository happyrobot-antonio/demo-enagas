# Ejemplos de Uso - Mesa de Servicios GTS

Este documento muestra cómo simular las operaciones del agente de voz enviando datos a la API.

## 🚀 Inicio Rápido

### 1. Iniciar el sistema
```bash
chmod +x start.sh
./start.sh
```

### 2. Verificar que todo funciona
```bash
curl http://localhost:3000/health
```

### 3. Abrir el dashboard
Navega a: http://localhost:5173

---

## 📝 Ejemplos de Llamadas del Agente

### Escenario 1: Incidencia Técnica - Error en Portal SL-ATR

**Contexto:** Usuario no puede acceder al portal SL-ATR

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INCIDENCIA_TECNICA",
    "descripcion": "Usuario no puede acceder al portal SL-ATR. Mensaje de error: Credenciales inválidas. Funcionaba correctamente ayer.",
    "usuario_afectado": "jruiz_gasur",
    "sistema": "SL-ATR",
    "contacto": {
      "nombre": "Javier Ruiz",
      "empresa": "GasDistribución Sur",
      "telefono": "600123456",
      "email": "jruiz@gasdistribucion.es"
    },
    "prioridad": "ALTA",
    "notas": "El usuario intentó recuperar contraseña sin éxito"
  }'
```

**Resultado esperado:**
- ✅ Ticket creado con número GTS-2026-XXXXX
- ✅ Visible instantáneamente en el dashboard
- ✅ Notificación en tiempo real vía WebSocket

---

### Escenario 2: Emergencia - Fuga de Gas Detectada

**Contexto:** Llamada de emergencia desde polígono industrial

```bash
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_incidente": "FUGA",
    "ubicacion_completa": "Polígono Industrial Las Américas, Getafe, Madrid. Entre calle Industria 5 y 7",
    "contacto_llamante": {
      "nombre": "Antonio Fernández",
      "telefono": "655432109",
      "empresa": "Gestión de Polígonos Industriales Madrid"
    },
    "descripcion_situacion": "Olor intenso a gas detectado cerca de instalación vallada de Enagás. Personal evacuado por precaución.",
    "nivel_riesgo": "MEDIO",
    "municipio": "Getafe",
    "provincia": "Madrid"
  }'
```

**Resultado esperado:**
- 🚨 Emergencia activada con código EMG-2026-XXXXX
- 🚨 Alerta crítica en dashboard (fondo rojo)
- 🚨 Notificación del navegador si está permitida
- 🚨 Tiempo estimado de llegada calculado (40 min para riesgo MEDIO)

---

### Escenario 3: Consulta Operativa - Plazos de Nominación

**Contexto:** Usuario pregunta sobre plazos de modificación de nominaciones

**Paso 1: Registrar la llamada**
```bash
curl -X POST http://localhost:3000/api/calls \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_llamante": "Sergio Martín",
    "empresa": "Energy Trade International",
    "telefono": "600555444",
    "tipo_consulta": "CONSULTA_OPERATIVA",
    "categoria": "Programación",
    "notas": "Consulta sobre plazos de modificación de nominaciones para día D"
  }'
```

**Paso 2: Registrar búsqueda en documentación**
```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -d '{
    "query": "plazo modificación nominación programación día D",
    "tipo_proceso": "programacion",
    "usuario_solicitante": "Sergio Martín",
    "contexto": "Consulta sobre deadline para modificar nominaciones",
    "resultados_count": 3,
    "documentos_encontrados": [
      {
        "titulo": "Procedimiento de Programación",
        "seccion": "Plazos de Nominación"
      }
    ]
  }'
```

**Paso 3: Finalizar la llamada** (obtén el ID de la respuesta del paso 1)
```bash
curl -X PATCH http://localhost:3000/api/calls/{CALL_ID}/end \
  -H "Content-Type: application/json" \
  -d '{
    "duracion_segundos": 180,
    "resolucion": "Consulta resuelta. Usuario informado del plazo límite 14:00h día D-1",
    "notas": "Usuario satisfecho con la información proporcionada"
  }'
```

---

### Escenario 4: Transferencia a Especialista

**Contexto:** Consulta técnica compleja que requiere especialista

```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "area_destino": "Operaciones - Capacidades",
    "resumen_consulta": "Cliente solicita información detallada sobre capacidad disponible de inyección en Planta de Huelva para Q1 2026",
    "datos_usuario": {
      "nombre": "Laura Gómez",
      "empresa": "EnerPlus Comercializadora",
      "telefono": "600987654",
      "email": "laura.gomez@enerplus.es"
    }
  }'
```

---

### Escenario 5: Emergencia Crítica - Obras No Autorizadas

**Contexto:** Excavación cerca de gasoducto sin consulta previa

```bash
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_incidente": "OBRAS_NO_AUTORIZADAS",
    "ubicacion_completa": "Calle Fray Luis de León 28, Valladolid",
    "contacto_llamante": {
      "nombre": "Miguel Ángel Torres",
      "telefono": "620555432",
      "empresa": "Construcciones Castilla"
    },
    "descripcion_situacion": "Excavación con retroexcavadora a 2 metros de profundidad cerca de señalización Enagás. Obras detenidas.",
    "nivel_riesgo": "ALTO",
    "municipio": "Valladolid",
    "provincia": "Valladolid"
  }'
```

---

## 📊 Consultar Estadísticas en Tiempo Real

```bash
# Estadísticas generales
curl http://localhost:3000/api/stats

# Tickets abiertos
curl http://localhost:3000/api/tickets/status/open

# Emergencias activas
curl http://localhost:3000/api/emergencies/active

# Llamadas en curso
curl http://localhost:3000/api/calls/active

# Estado de sistemas
curl http://localhost:3000/api/system-status
```

---

## 🔄 Actualizar Estados

### Actualizar un ticket a resuelto
```bash
curl -X PATCH http://localhost:3000/api/tickets/{TICKET_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "RESUELTO",
    "notas": "Usuario puede acceder correctamente tras reiniciar credenciales",
    "resolved_at": "2026-01-21T14:30:00Z"
  }'
```

### Actualizar estado de emergencia
```bash
curl -X PATCH http://localhost:3000/api/emergencies/{EMERGENCY_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "CONTROLADA",
    "equipo_asignado": "Equipo Técnico Madrid Sur - Juan García",
    "atendida_at": "2026-01-21T11:15:00Z"
  }'
```

### Cambiar estado de sistema
```bash
curl -X PATCH http://localhost:3000/api/system-status/{SYSTEM_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "MANTENIMIENTO",
    "mensaje": "Mantenimiento programado del sistema",
    "mantenimiento_programado": true,
    "inicio_mantenimiento": "2026-01-22T02:00:00Z",
    "fin_mantenimiento": "2026-01-22T06:00:00Z"
  }'
```

---

## 🧪 Script de Prueba Completo

Guarda esto como `test-demo.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"

echo "🧪 Iniciando pruebas del sistema GTS..."
echo ""

echo "1️⃣ Creando ticket de incidencia técnica..."
curl -s -X POST $API_URL/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INCIDENCIA_TECNICA",
    "descripcion": "Test: Error en portal",
    "sistema": "SL-ATR",
    "contacto": {"nombre": "Test User", "email": "test@test.com"},
    "prioridad": "ALTA"
  }' | jq '.'

sleep 2

echo ""
echo "2️⃣ Activando emergencia de prueba..."
curl -s -X POST $API_URL/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_incidente": "FUGA",
    "ubicacion_completa": "Test Location Madrid",
    "contacto_llamante": {"nombre": "Test", "telefono": "600000000"},
    "descripcion_situacion": "Test fuga detectada",
    "nivel_riesgo": "MEDIO"
  }' | jq '.'

sleep 2

echo ""
echo "3️⃣ Registrando llamada..."
curl -s -X POST $API_URL/api/calls \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_llamante": "Test Caller",
    "empresa": "Test Company",
    "tipo_consulta": "CONSULTA_OPERATIVA"
  }' | jq '.'

sleep 2

echo ""
echo "4️⃣ Obteniendo estadísticas..."
curl -s $API_URL/api/stats | jq '.'

echo ""
echo "✅ Pruebas completadas. Revisa el dashboard en http://localhost:5173"
```

Ejecuta:
```bash
chmod +x test-demo.sh
./test-demo.sh
```

---

## 🌐 Integración con Cliente WebSocket

Ejemplo en JavaScript para escuchar eventos en tiempo real:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
});

socket.on('ticket:created', (ticket) => {
  console.log('🎫 Nuevo ticket:', ticket.numero_ticket);
});

socket.on('emergency:activated', (emergency) => {
  console.log('🚨 EMERGENCIA:', emergency.codigo_emergencia);
  // Aquí podrías enviar notificaciones, actualizar UI, etc.
});

socket.on('call:started', (call) => {
  console.log('📞 Nueva llamada de:', call.nombre_llamante);
});
```

---

## 📈 Monitoreo

Ver logs en tiempo real:
```bash
# Todos los servicios
docker-compose logs -f

# Solo API
docker-compose logs -f api

# Solo base de datos
docker-compose logs -f database

# Solo frontend
docker-compose logs -f frontend
```

---

## 🛑 Detener el Sistema

```bash
chmod +x stop.sh
./stop.sh
```

O manualmente:
```bash
docker-compose down
```

Para eliminar también los datos:
```bash
docker-compose down -v
```

---

## 💡 Consejos

1. **Abre el dashboard primero** (http://localhost:5173) para ver las actualizaciones en tiempo real

2. **Usa jq** para formatear respuestas JSON:
   ```bash
   curl http://localhost:3000/api/stats | jq '.'
   ```

3. **Guarda IDs** de las respuestas para poder actualizar recursos después

4. **Prueba WebSockets** abriendo múltiples pestañas del dashboard y viendo las actualizaciones sincronizadas

5. **Simula flujos reales** del agente de voz siguiendo los escenarios del prompt

---

¡Listo para probar el sistema! 🚀
