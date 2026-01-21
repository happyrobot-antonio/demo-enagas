# 🤖 Mapeo de Tools del Agente de Voz → Endpoints API

Este documento define **exactamente** qué endpoint debe llamar el agente de voz para cada tool y qué datos debe enviar.

---

## 🔧 Tools del Agente

### 1️⃣ `search_gts_documentation`

**Cuándo usarla:**
- Usuario hace consultas operativas sobre procesos del GTS
- Necesitas confirmar información técnica o normativa
- Dudas sobre procedimientos, plazos, requisitos

**Endpoint:**
```
POST /api/searches
```

**Body:**
```json
{
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
}
```

**Campos del Body:**

| Campo | Tipo | Requerido | Descripción | Valores/Ejemplos |
|-------|------|-----------|-------------|------------------|
| `query` | string | ✅ SÍ | Términos de búsqueda extraídos de la consulta del usuario | "habilitación punto suministro cliente directo", "plazo nominación", "garantías contrato acceso" |
| `tipo_proceso` | string | ❌ No | Tipo de proceso del GTS relacionado | `habilitacion`, `programacion`, `medicion`, `balance`, `liquidacion`, `garantias`, `contratacion` |
| `usuario_solicitante` | string | ❌ No | Nombre del usuario que llama | "Laura Gómez", "Sergio Martín" |
| `contexto` | string | ❌ No | Contexto adicional de la búsqueda | "Consulta sobre nuevo punto industrial", "Duda sobre plazos" |
| `resultados_count` | integer | ❌ No | Número de documentos encontrados | 0, 3, 5 |
| `documentos_encontrados` | array | ❌ No | Documentos relevantes encontrados | `[{"titulo": "...", "seccion": "..."}]` |

**Ejemplo Real - Escenario "Habilitación":**
```json
{
  "query": "habilitación punto suministro documentación cliente directo red transporte",
  "tipo_proceso": "habilitacion",
  "usuario_solicitante": "Laura Gómez",
  "contexto": "Comercializadora EnerPlus consultando documentación necesaria para cliente industrial"
}
```

**Ejemplo Real - Escenario "Programación":**
```json
{
  "query": "plazo límite modificación nominación día D-1",
  "tipo_proceso": "programacion",
  "usuario_solicitante": "Sergio Martín",
  "contexto": "Consulta sobre horario límite para modificar nominación"
}
```

---

### 2️⃣ `create_gts_ticket`

**Cuándo usarla:**
- Usuario reporta incidencia técnica (error en portal, sistema caído)
- Problema que requiere seguimiento por equipo técnico
- Consulta que no puedes resolver y necesita respuesta posterior

**Endpoint:**
```
POST /api/tickets
```

**Body:**
```json
{
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
}
```

**Campos del Body:**

| Campo | Tipo | Requerido | Descripción | Valores/Ejemplos |
|-------|------|-----------|-------------|------------------|
| `tipo` | string | ✅ SÍ | Tipo de ticket | `INCIDENCIA_TECNICA`, `CONSULTA_ESPECIALIZADA`, `RECLAMACION` |
| `descripcion` | string | ✅ SÍ | Descripción detallada del problema | "Usuario no puede acceder al portal SL-ATR. Error de autenticación" |
| `contacto` | object | ✅ SÍ | Datos de contacto del usuario | `{"nombre": "...", "empresa": "...", "telefono": "...", "email": "..."}` |
| `usuario_afectado` | string | ❌ No | Usuario/login del sistema afectado | "jruiz_gasur", "lgomez_enerplus" |
| `sistema` | string | ❌ No | Sistema donde ocurre el problema | `SL-ATR`, `EnergyData`, `Portal Transportista`, `Telemedida` |
| `prioridad` | string | ❌ No | Prioridad del ticket | `CRITICA`, `ALTA`, `MEDIA`, `BAJA` (default: `MEDIA`) |
| `notas` | string | ❌ No | Notas adicionales o contexto | "Intentó recuperar contraseña sin éxito", "Problema desde esta mañana" |

**Prioridad según el Prompt:**
- `CRITICA`: Sistema SL-ATR caído, imposibilidad total de nominar
- `ALTA`: Errores que impiden operaciones con plazo inminente
- `MEDIA`: Problemas funcionales con workaround (default)
- `BAJA`: Consultas sobre funcionamiento, mejoras

**Ejemplo Real - Escenario "Error de acceso SL-ATR":**
```json
{
  "tipo": "INCIDENCIA_TECNICA",
  "descripcion": "Usuario no puede acceder al portal SL-ATR. Introduce usuario y contraseña correctos pero aparece 'Error de autenticación. Credenciales inválidas'. Ayer funcionaba correctamente.",
  "usuario_afectado": "jruiz_gasur",
  "sistema": "SL-ATR",
  "contacto": {
    "nombre": "Javier Ruiz",
    "empresa": "GasDistribución Sur",
    "telefono": "600123456",
    "email": "jruiz@gasdistribucion.es"
  },
  "prioridad": "ALTA",
  "notas": "El usuario intentó recuperar contraseña usando la opción del portal sin éxito. Necesita acceder urgentemente para nominaciones."
}
```

**Ejemplo Real - Escenario "Consulta especializada":**
```json
{
  "tipo": "CONSULTA_ESPECIALIZADA",
  "descripcion": "Cliente solicita análisis de capacidad disponible para nuevo punto de inyección en planta de Huelva para Q1 2026. Requiere evaluación técnica del equipo de operaciones.",
  "sistema": "Capacidades",
  "contacto": {
    "nombre": "Laura Gómez",
    "empresa": "EnerPlus Comercializadora",
    "telefono": "600987654",
    "email": "laura.gomez@enerplus.es"
  },
  "prioridad": "MEDIA",
  "notas": "Consulta compleja que requiere análisis de capacidades por equipo especializado"
}
```

---

### 3️⃣ `transfer_to_specialist`

**Cuándo usarla:**
- Consulta técnica muy específica que excede primer nivel
- Usuario solicita hablar con especialista de área
- Reclamaciones formales o temas contractuales complejos

**Endpoint:**
```
POST /api/transfers
```

**Body:**
```json
{
  "area_destino": "Operaciones - Capacidades",
  "resumen_consulta": "Cliente solicita información detallada sobre capacidad disponible de inyección en Planta de Huelva para Q1 2026",
  "datos_usuario": {
    "nombre": "Laura Gómez",
    "empresa": "EnerPlus Comercializadora",
    "telefono": "600987654",
    "email": "laura.gomez@enerplus.es"
  },
  "ticket_id": null
}
```

**Campos del Body:**

| Campo | Tipo | Requerido | Descripción | Valores/Ejemplos |
|-------|------|-----------|-------------|------------------|
| `area_destino` | string | ✅ SÍ | Área especializada a la que transferir | Ver tabla de áreas abajo |
| `resumen_consulta` | string | ✅ SÍ | Resumen claro de la consulta del usuario | "Cliente solicita información sobre capacidades en Planta de Huelva" |
| `datos_usuario` | object | ✅ SÍ | Información del usuario | `{"nombre": "...", "empresa": "...", "telefono": "...", "email": "..."}` |
| `ticket_id` | string/uuid | ❌ No | ID de ticket relacionado (si existe) | UUID del ticket previo |

**Áreas de Destino (según el Prompt):**

| Área | Cuándo usar |
|------|-------------|
| `Operaciones` | Consultas técnicas sobre infraestructura, capacidades, programación compleja |
| `GTS Internacional` | Interconexiones, operativa internacional |
| `Comercial` | Contratos, tarifas, peajes, aspectos comerciales |
| `Medición` | Problemas de medida, telemedida, ajustes de consumos |
| `Sistemas e Infraestructuras` | Incidencias técnicas de sistemas IT |
| `Regulación` | Interpretación normativa compleja, procedimientos regulatorios |
| `Atención Cliente` | Reclamaciones, temas administrativos |

**Ejemplo Real - Escenario "Consulta sobre capacidades":**
```json
{
  "area_destino": "Operaciones",
  "resumen_consulta": "Cliente necesita información detallada sobre capacidad disponible de inyección en Planta de Huelva para Q1 2026. Consulta técnica compleja que requiere análisis del equipo de operaciones.",
  "datos_usuario": {
    "nombre": "Laura Gómez",
    "empresa": "EnerPlus Comercializadora",
    "telefono": "600987654",
    "email": "laura.gomez@enerplus.es"
  }
}
```

**Ejemplo Real - Escenario "Reclamación sobre facturación":**
```json
{
  "area_destino": "Comercial",
  "resumen_consulta": "Cliente presenta reclamación formal sobre liquidación del mes anterior. Considera que el cálculo de desvíos es incorrecto y solicita revisión detallada.",
  "datos_usuario": {
    "nombre": "Carlos Fernández",
    "empresa": "Gas Natural Fenosa",
    "telefono": "610234567",
    "email": "cfernandez@gasnatural.es"
  }
}
```

---

### 4️⃣ `activate_emergency_protocol`

**Cuándo usarla:**
- **Fuga de gas detectada** (olor, sonido, visual)
- **Daño a infraestructura gasista** (impacto, rotura)
- **Obras no autorizadas** cerca de gasoductos
- Cualquier **situación de riesgo** para personas o instalaciones

**⚠️ PRIORIDAD ABSOLUTA: Usar INMEDIATAMENTE cuando se detecte riesgo de seguridad**

**Endpoint:**
```
POST /api/emergencies
```

**Body:**
```json
{
  "tipo_incidente": "FUGA",
  "ubicacion_completa": "Polígono Industrial Las Américas, Getafe, Madrid. Entre calle Industria 5 y 7. Cerca de instalación vallada de Enagás.",
  "contacto_llamante": {
    "nombre": "Antonio Fernández",
    "telefono": "655432109",
    "empresa": "Gestión de Polígonos Industriales Madrid"
  },
  "descripcion_situacion": "Olor intenso a gas detectado cerca de instalación vallada de Enagás. Personal de tres naves evacuado por precaución.",
  "nivel_riesgo": "MEDIO",
  "municipio": "Getafe",
  "provincia": "Madrid",
  "coordenadas": null
}
```

**Campos del Body:**

| Campo | Tipo | Requerido | Descripción | Valores/Ejemplos |
|-------|------|-----------|-------------|------------------|
| `tipo_incidente` | string | ✅ SÍ | Tipo de emergencia | `FUGA`, `DAÑO_INFRAESTRUCTURA`, `OBRAS_NO_AUTORIZADAS`, `ANOMALIA_CRITICA` |
| `ubicacion_completa` | string | ✅ SÍ | Ubicación exacta y detallada | "Polígono Industrial Las Américas, Getafe, Madrid, calle Industria 5-7" |
| `contacto_llamante` | object | ✅ SÍ | Datos del llamante | `{"nombre": "...", "telefono": "...", "empresa": "..."}` |
| `descripcion_situacion` | string | ✅ SÍ | Descripción detallada de la situación | "Olor intenso a gas detectado cerca de instalación vallada" |
| `nivel_riesgo` | string | ✅ SÍ | Nivel de riesgo evaluado | `CRITICO`, `ALTO`, `MEDIO`, `BAJO` |
| `municipio` | string | ❌ No | Municipio | "Getafe", "Valladolid" |
| `provincia` | string | ❌ No | Provincia | "Madrid", "Valladolid" |
| `coordenadas` | object | ❌ No | Coordenadas GPS si están disponibles | `{"lat": 40.305, "lng": -3.732}` |

**Niveles de Riesgo (según situación):**

| Nivel | Cuándo asignar |
|-------|----------------|
| `CRITICO` | Fuga activa con personas en peligro inmediato, explosión, daño grave visible |
| `ALTO` | Fuga intensa, obras con excavadora cerca de gasoducto, daño a instalaciones |
| `MEDIO` | Olor a gas moderado, obras detenidas preventivamente, anomalía sospechosa |
| `BAJO` | Consulta preventiva, señalización dañada sin riesgo inmediato |

**Ejemplo Real - Escenario "Fuga de gas":**
```json
{
  "tipo_incidente": "FUGA",
  "ubicacion_completa": "Polígono Industrial Las Américas, Getafe, Madrid. Entre calle Industria número 5 y número 7. Hay un vallado con cartel de Enagás justo donde más huele.",
  "contacto_llamante": {
    "nombre": "Antonio Fernández",
    "telefono": "655432109",
    "empresa": "Gestión de Polígonos Industriales Madrid"
  },
  "descripcion_situacion": "Olor intenso a gas detectado en zona industrial. Hay tres naves con personal que han sido evacuadas por megafonía como precaución. El olor proviene de instalación vallada de Enagás.",
  "nivel_riesgo": "MEDIO",
  "municipio": "Getafe",
  "provincia": "Madrid"
}
```

**Ejemplo Real - Escenario "Obras no autorizadas":**
```json
{
  "tipo_incidente": "OBRAS_NO_AUTORIZADAS",
  "ubicacion_completa": "Calle Fray Luis de León número 28, Valladolid",
  "contacto_llamante": {
    "nombre": "Miguel Ángel Torres",
    "telefono": "620555432",
    "empresa": "Construcciones Castilla"
  },
  "descripcion_situacion": "Excavación con retroexcavadora a 2 metros de profundidad. Detectada señalización de Enagás muy cerca. Obras detenidas inmediatamente al ver los postes.",
  "nivel_riesgo": "ALTO",
  "municipio": "Valladolid",
  "provincia": "Valladolid"
}
```

**Ejemplo Real - Escenario "Daño a infraestructura":**
```json
{
  "tipo_incidente": "DAÑO_INFRAESTRUCTURA",
  "ubicacion_completa": "Carretera M-506, km 23, Alcorcón, Madrid",
  "contacto_llamante": {
    "nombre": "Juan García",
    "telefono": "666777888",
    "empresa": "Guardia Civil Tráfico"
  },
  "descripcion_situacion": "Accidente de tráfico. Camión se ha salido de la vía e impactado contra instalación con señalización de Enagás. Visible daño en estructura metálica.",
  "nivel_riesgo": "ALTO",
  "municipio": "Alcorcón",
  "provincia": "Madrid"
}
```

---

### 5️⃣ `check_system_status`

**Cuándo usarla:**
- Usuario pregunta si un sistema está operativo
- Antes de registrar incidencia técnica (verificar si es problema conocido)
- Usuario reporta lentitud o comportamiento extraño

**Endpoint:**
```
GET /api/system/status
```

**Body:**
```
N/A (es una petición GET, no lleva body)
```

**Query Parameters (opcionales):**
```
?sistema=SL-ATR
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "status": "operational",
  "sistemas": {
    "SL-ATR": "operativo",
    "Portal Shipper": "operativo",
    "EDIG@S": "operativo",
    "ATR Comunitario": "operativo",
    "Plataforma Programación": "operativo"
  },
  "timestamp": "2026-01-22T10:00:00Z"
}
```

**Posibles Estados:**
- `operativo`: Sistema funcionando correctamente
- `degradado`: Sistema operativo pero con lentitud
- `mantenimiento`: Mantenimiento programado
- `caido`: Sistema no disponible

**Ejemplo de Uso:**
```bash
# Verificar estado general de todos los sistemas
GET /api/system/status

# Verificar estado de un sistema específico
GET /api/system/status?sistema=SL-ATR
```

---

### 6️⃣ `register_call` (Tool Adicional Implícita)

**Cuándo usarla:**
- Al inicio de cada llamada para registrarla
- Permite tracking de todas las interacciones

**Endpoint:**
```
POST /api/calls
```

**Body:**
```json
{
  "nombre_llamante": "Sergio Martín",
  "empresa": "Energy Trade International",
  "telefono": "600555444",
  "tipo_consulta": "CONSULTA_OPERATIVA",
  "categoria": "Programación",
  "notas": "Consulta sobre plazos de modificación de nominaciones para día D"
}
```

**Campos del Body:**

| Campo | Tipo | Requerido | Descripción | Valores |
|-------|------|-----------|-------------|---------|
| `nombre_llamante` | string | ✅ SÍ | Nombre del usuario | "Sergio Martín" |
| `empresa` | string | ❌ No | Empresa u organización | "Energy Trade International" |
| `telefono` | string | ❌ No | Teléfono de contacto | "600555444" |
| `tipo_consulta` | string | ❌ No | Tipo de consulta | `CONSULTA_OPERATIVA`, `INCIDENCIA_TECNICA`, `EMERGENCIA`, `RECLAMACION` |
| `categoria` | string | ❌ No | Categoría específica | "Programación", "Habilitación", "Medición", "Portal SL-ATR" |
| `notas` | string | ❌ No | Notas de la llamada | Resumen breve |

**Finalizar Llamada:**
```
PATCH /api/calls/{CALL_ID}/end
```

**Body:**
```json
{
  "duracion_segundos": 180,
  "resolucion": "RESUELTA",
  "notas": "Consulta resuelta. Usuario informado del plazo límite 14:00h día D-1"
}
```

---

## 📋 Resumen Rápido

| Tool del Agente | Endpoint API | Método | Campos Mínimos Requeridos |
|-----------------|--------------|--------|---------------------------|
| `search_gts_documentation` | `/api/searches` | POST | `query` |
| `create_gts_ticket` | `/api/tickets` | POST | `tipo`, `descripcion`, `contacto` |
| `transfer_to_specialist` | `/api/transfers` | POST | `area_destino`, `resumen_consulta`, `datos_usuario` |
| `activate_emergency_protocol` | `/api/emergencies` | POST | `tipo_incidente`, `ubicacion_completa`, `contacto_llamante`, `descripcion_situacion`, `nivel_riesgo` |
| `check_system_status` | `/api/system/status` | GET | (ninguno) |
| `register_call` | `/api/calls` | POST | `nombre_llamante` |

---

## 🎯 Flujo Típico de Llamadas

### Escenario: Incidencia Técnica en SL-ATR

1. **Registrar llamada**
```bash
POST /api/calls
{
  "nombre_llamante": "Javier Ruiz",
  "empresa": "GasDistribución Sur",
  "telefono": "600123456",
  "tipo_consulta": "INCIDENCIA_TECNICA",
  "categoria": "Portal SL-ATR"
}
```

2. **Verificar estado del sistema**
```bash
GET /api/system/status?sistema=SL-ATR
```

3. **Crear ticket**
```bash
POST /api/tickets
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
  "prioridad": "ALTA"
}
```

4. **Finalizar llamada**
```bash
PATCH /api/calls/{call_id}/end
{
  "duracion_segundos": 240,
  "resolucion": "TICKET_CREADO",
  "notas": "Ticket GTS-2026-00234 creado. Plazo respuesta: 4h"
}
```

---

## 🚨 Flujo de Emergencia

### Escenario: Fuga de Gas

1. **Activar protocolo inmediatamente (SIN registrar llamada primero)**
```bash
POST /api/emergencies
{
  "tipo_incidente": "FUGA",
  "ubicacion_completa": "Polígono Las Américas, Getafe, Madrid",
  "contacto_llamante": {
    "nombre": "Antonio Fernández",
    "telefono": "655432109",
    "empresa": "Gestión Polígonos"
  },
  "descripcion_situacion": "Olor intenso a gas cerca de instalación vallada",
  "nivel_riesgo": "MEDIO",
  "municipio": "Getafe",
  "provincia": "Madrid"
}
```

2. **Registrar llamada después (para estadísticas)**
```bash
POST /api/calls
{
  "nombre_llamante": "Antonio Fernández",
  "empresa": "Gestión Polígonos",
  "telefono": "655432109",
  "tipo_consulta": "EMERGENCIA",
  "categoria": "Fuga"
}
```

---

## 💡 Consejos para el Agente

1. **Emergencias**: `activate_emergency_protocol` es SIEMPRE la prioridad #1
2. **Búsquedas**: Usa `search_gts_documentation` liberalmente antes de escalar
3. **Tickets**: Siempre captura email para seguimiento
4. **Transferencias**: Explica al usuario antes de transferir
5. **Llamadas**: Registra al inicio para tener métricas completas

---

✅ **Este mapeo está alineado al 100% con la API existente y los casos de uso del prompt del agente**
