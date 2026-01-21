# Documentación de la API - Mesa de Servicios GTS

## Base URL
```
http://localhost:3000
```

## Autenticación
La API actual no requiere autenticación. En producción, implementa JWT o similar.

---

## Endpoints

### 📊 Estadísticas

#### `GET /api/stats`
Obtiene estadísticas generales del sistema.

**Response:**
```json
{
  "success": true,
  "stats": {
    "tickets_abiertos": 5,
    "emergencias_activas": 2,
    "llamadas_en_curso": 1,
    "transferencias_pendientes": 3,
    "tickets_hoy": 12,
    "emergencias_hoy": 3
  }
}
```

---

### 🎫 Tickets

#### `POST /api/tickets`
Crea un nuevo ticket (tool: `create_gts_ticket`).

**Request Body:**
```json
{
  "tipo": "INCIDENCIA_TECNICA",
  "descripcion": "Error de autenticación en SL-ATR",
  "usuario_afectado": "jruiz_gasur",
  "sistema": "SL-ATR",
  "contacto": {
    "nombre": "Javier Ruiz",
    "empresa": "GasDistribución Sur",
    "telefono": "600123456",
    "email": "jruiz@gasdistribucion.es"
  },
  "prioridad": "ALTA",
  "notas": "El usuario no puede acceder desde ayer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket creado exitosamente",
  "ticket": {
    "id": "uuid",
    "numero_ticket": "GTS-2026-00001",
    "tipo": "INCIDENCIA_TECNICA",
    "estado": "ABIERTO",
    "created_at": "2026-01-21T10:00:00Z",
    ...
  }
}
```

#### `GET /api/tickets`
Lista todos los tickets con filtros opcionales.

**Query Parameters:**
- `estado` (opcional): ABIERTO, EN_PROCESO, RESUELTO, CERRADO, ESCALADO
- `prioridad` (opcional): CRITICA, ALTA, MEDIA, BAJA
- `tipo` (opcional): INCIDENCIA_TECNICA, CONSULTA_ESPECIALIZADA, RECLAMACION
- `limit` (opcional, default: 50)
- `offset` (opcional, default: 0)

#### `GET /api/tickets/:id`
Obtiene un ticket específico por ID.

#### `PATCH /api/tickets/:id`
Actualiza un ticket existente.

**Request Body:**
```json
{
  "estado": "RESUELTO",
  "notas": "Problema resuelto reiniciando credenciales",
  "resolved_at": "2026-01-21T12:00:00Z"
}
```

#### `GET /api/tickets/status/open`
Obtiene tickets abiertos (últimos 20).

---

### 🚨 Emergencias

#### `POST /api/emergencies`
Activa un protocolo de emergencia (tool: `activate_emergency_protocol`).

**Request Body:**
```json
{
  "tipo_incidente": "FUGA",
  "ubicacion_completa": "Polígono Industrial Las Américas, Getafe, Madrid, calle Industria 5-7",
  "contacto_llamante": {
    "nombre": "Antonio Fernández",
    "telefono": "655432109",
    "empresa": "Gestión de Polígonos"
  },
  "descripcion_situacion": "Olor intenso a gas detectado cerca de instalación vallada",
  "nivel_riesgo": "MEDIO",
  "municipio": "Getafe",
  "provincia": "Madrid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Protocolo de emergencia activado",
  "emergency": {
    "id": "uuid",
    "codigo_emergencia": "EMG-2026-00001",
    "tipo_incidente": "FUGA",
    "nivel_riesgo": "MEDIO",
    "estado": "ACTIVA",
    "tiempo_estimado_llegada": 40,
    "created_at": "2026-01-21T10:00:00Z",
    ...
  },
  "tiempo_estimado_llegada": "40 minutos"
}
```

#### `GET /api/emergencies`
Lista todas las emergencias con filtros opcionales.

**Query Parameters:**
- `estado` (opcional): ACTIVA, EN_ATENCION, CONTROLADA, RESUELTA, FALSA_ALARMA
- `tipo_incidente` (opcional): FUGA, DAÑO_INFRAESTRUCTURA, OBRAS_NO_AUTORIZADAS, ANOMALIA_CRITICA
- `nivel_riesgo` (opcional): CRITICO, ALTO, MEDIO, BAJO

#### `GET /api/emergencies/active`
Obtiene emergencias activas.

#### `PATCH /api/emergencies/:id`
Actualiza una emergencia.

---

### 🔄 Transferencias

#### `POST /api/transfers`
Registra una transferencia a especialista (tool: `transfer_to_specialist`).

**Request Body:**
```json
{
  "area_destino": "Operaciones",
  "resumen_consulta": "Consulta técnica sobre capacidades de inyección en Planta de Huelva",
  "datos_usuario": {
    "nombre": "Laura Gómez",
    "empresa": "EnerPlus",
    "telefono": "600987654",
    "email": "laura.gomez@enerplus.es"
  },
  "ticket_id": "uuid-opcional"
}
```

#### `GET /api/transfers`
Lista todas las transferencias.

---

### 🔍 Búsquedas en Documentación

#### `POST /api/searches`
Registra una búsqueda en documentación (tool: `search_gts_documentation`).

**Request Body:**
```json
{
  "query": "habilitación punto suministro documentación cliente directo",
  "tipo_proceso": "habilitacion",
  "usuario_solicitante": "Laura Gómez",
  "contexto": "Consulta sobre nuevo punto de suministro industrial",
  "resultados_count": 5,
  "documentos_encontrados": [
    {
      "titulo": "Procedimiento de Habilitación",
      "seccion": "Cliente Directo Red Transporte"
    }
  ]
}
```

#### `GET /api/searches`
Historial de búsquedas.

#### `GET /api/searches/recent`
Búsquedas recientes (últimas 20).

---

### 📞 Llamadas

#### `POST /api/calls`
Registra una nueva llamada.

**Request Body:**
```json
{
  "nombre_llamante": "María López",
  "empresa": "GasNatural",
  "telefono": "600111222",
  "tipo_consulta": "CONSULTA_OPERATIVA",
  "categoria": "Programación",
  "notas": "Consulta sobre plazos de nominación"
}
```

#### `GET /api/calls`
Lista todas las llamadas.

#### `GET /api/calls/active`
Obtiene llamadas en curso.

#### `PATCH /api/calls/:id/end`
Finaliza una llamada.

**Request Body:**
```json
{
  "duracion_segundos": 180,
  "resolucion": "Consulta resuelta satisfactoriamente",
  "notas": "Usuario informado sobre plazo límite 14:00h"
}
```

---

### 🖥️ Estado de Sistemas

#### `GET /api/system-status`
Obtiene el estado de todos los sistemas GTS.

**Response:**
```json
{
  "success": true,
  "systems": [
    {
      "id": "uuid",
      "sistema": "SL-ATR",
      "estado": "OPERATIVO",
      "mensaje": "Sistema funcionando correctamente",
      "mantenimiento_programado": false,
      "updated_at": "2026-01-21T10:00:00Z"
    }
  ]
}
```

#### `PATCH /api/system-status/:id`
Actualiza el estado de un sistema.

**Request Body:**
```json
{
  "estado": "MANTENIMIENTO",
  "mensaje": "Mantenimiento programado",
  "mantenimiento_programado": true,
  "inicio_mantenimiento": "2026-01-22T02:00:00Z",
  "fin_mantenimiento": "2026-01-22T06:00:00Z"
}
```

---

## WebSocket Events

La API emite eventos en tiempo real vía WebSocket (Socket.IO).

**Conexión:**
```javascript
const socket = io('http://localhost:3000');
```

### Eventos Emitidos por el Servidor

#### `connected`
Mensaje de bienvenida al conectarse.

#### `ticket:created`
Nuevo ticket creado.

#### `ticket:updated`
Ticket actualizado.

#### `emergency:activated`
Nueva emergencia activada (¡ALERTA CRÍTICA!).

#### `emergency:updated`
Emergencia actualizada.

#### `transfer:created`
Nueva transferencia registrada.

#### `transfer:updated`
Transferencia actualizada.

#### `call:started`
Nueva llamada iniciada.

#### `call:ended`
Llamada finalizada.

#### `search:performed`
Búsqueda en documentación realizada.

#### `system:updated`
Estado de sistema actualizado.

---

## Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Error en los parámetros de la solicitud
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## Tipos de Datos

### Prioridades de Tickets
- `CRITICA` - Respuesta: 1 hora
- `ALTA` - Respuesta: 4 horas
- `MEDIA` - Respuesta: 1 día
- `BAJA` - Respuesta: 3 días

### Estados de Tickets
- `ABIERTO` - Recién creado
- `EN_PROCESO` - En revisión
- `RESUELTO` - Solucionado
- `CERRADO` - Cerrado definitivamente
- `ESCALADO` - Escalado a nivel superior

### Tipos de Incidente (Emergencias)
- `FUGA` - Fuga de gas detectada
- `DAÑO_INFRAESTRUCTURA` - Daño a instalaciones
- `OBRAS_NO_AUTORIZADAS` - Obras cerca de infraestructura sin autorización
- `ANOMALIA_CRITICA` - Anomalía crítica en sistemas

### Niveles de Riesgo
- `CRITICO` - ETA: 15 min
- `ALTO` - ETA: 25 min
- `MEDIO` - ETA: 40 min
- `BAJO` - ETA: 60 min

---

## Ejemplos de Uso con cURL

### Crear un ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INCIDENCIA_TECNICA",
    "descripcion": "Error de autenticación",
    "sistema": "SL-ATR",
    "contacto": {
      "nombre": "Test User",
      "email": "test@test.com"
    },
    "prioridad": "ALTA"
  }'
```

### Activar emergencia
```bash
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_incidente": "FUGA",
    "ubicacion_completa": "Madrid, Calle Test 123",
    "contacto_llamante": {
      "nombre": "Test",
      "telefono": "600000000"
    },
    "descripcion_situacion": "Fuga detectada",
    "nivel_riesgo": "MEDIO"
  }'
```

### Obtener estadísticas
```bash
curl http://localhost:3000/api/stats
```

---

## Notas Importantes

1. **Tiempo Real**: Todos los eventos importantes se emiten vía WebSocket para actualización instantánea del dashboard.

2. **Numeración Automática**: Los códigos de ticket (`GTS-YYYY-XXXXX`) y emergencia (`EMG-YYYY-XXXXX`) se generan automáticamente.

3. **Timestamps**: Todos los timestamps están en formato ISO 8601 UTC.

4. **Contacto**: El campo `contacto` en tickets y `contacto_llamante` en emergencias deben incluir al menos nombre y email o teléfono.

5. **Paginación**: Los endpoints de listado soportan `limit` y `offset` para paginación.

---

## Soporte

Para problemas o preguntas sobre la API, contacta con el equipo de desarrollo.
