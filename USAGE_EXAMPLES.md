# 📚 Ejemplos de Uso Simplificados - API Mesa de Servicios GTS

## 🎯 Payloads Mínimos Requeridos

Esta guía muestra los payloads **más simples** para usar cada tool del agente.

---

## 1️⃣ Crear Ticket (`create_gts_ticket`)

### ✅ Payload Mínimo
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "No puedo acceder al sistema SL-ATR"
  }'
```

### 🔧 Con Contacto
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Error de autenticación en SL-ATR",
    "nombre_contacto": "Javier Ruiz",
    "telefono_contacto": "600123456"
  }'
```

### 💎 Payload Completo (Opcional)
```json
{
  "descripcion": "Error de autenticación en SL-ATR",
  "nombre_contacto": "Javier Ruiz",
  "telefono_contacto": "600123456",
  "email_contacto": "jruiz@gasdistribucion.es",
  "empresa_contacto": "GasDistribución Sur",
  "tipo": "INCIDENCIA_TECNICA",
  "usuario_afectado": "jruiz_gasur",
  "sistema": "SL-ATR",
  "prioridad": "ALTA",
  "notas": "El usuario no puede acceder desde ayer"
}
```

---

## 2️⃣ Activar Emergencia (`activate_emergency_protocol`)

### ✅ Payload Mínimo
```bash
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Olor a gas en zona industrial",
    "ubicacion": "Polígono Las Américas, Getafe"
  }'
```

### 🔧 Con Llamante
```bash
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Fuga detectada cerca de instalación",
    "ubicacion": "Calle Industria 5-7, Getafe, Madrid",
    "nombre_llamante": "Antonio Fernández",
    "telefono_llamante": "655432109"
  }'
```

### 💎 Payload Completo (Opcional)
```json
{
  "descripcion": "Olor intenso a gas detectado cerca de instalación vallada",
  "ubicacion": "Polígono Industrial Las Américas, Getafe, Madrid, calle Industria 5-7",
  "nombre_llamante": "Antonio Fernández",
  "telefono_llamante": "655432109",
  "tipo_incidente": "FUGA",
  "nivel_riesgo": "MEDIO",
  "municipio": "Getafe",
  "provincia": "Madrid"
}
```

---

## 3️⃣ Transferir a Especialista (`transfer_to_specialist`)

### ✅ Payload Mínimo
```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "consulta": "Necesito información sobre capacidades de inyección",
    "area": "Operaciones"
  }'
```

### 🔧 Con Usuario
```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "consulta": "Consulta técnica sobre Planta de Huelva",
    "area": "Operaciones",
    "nombre_usuario": "Laura Gómez",
    "telefono_usuario": "600987654"
  }'
```

### 💎 Payload Completo (Opcional)
```json
{
  "consulta": "Consulta técnica sobre capacidades de inyección en Planta de Huelva",
  "area": "Operaciones",
  "nombre_usuario": "Laura Gómez",
  "telefono_usuario": "600987654",
  "email_usuario": "laura.gomez@enerplus.es",
  "ticket_id": "uuid-del-ticket-relacionado"
}
```

**Áreas disponibles:**
- `Operaciones`
- `GTS Internacional`
- `Comercial`
- `Sistemas e Infraestructuras`
- `Atención Cliente`

---

## 4️⃣ Buscar Documentación (`search_gts_documentation`)

### ✅ Payload Mínimo
```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -d '{
    "query": "habilitación punto suministro cliente directo"
  }'
```

### 💎 Payload Completo (Opcional)
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

---

## 5️⃣ Verificar Estado del Sistema (`check_system_status`)

### ✅ Sin Payload (GET)
```bash
curl http://localhost:3000/api/system/status
```

**Respuesta:**
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

---

## 🎯 Resumen de Campos Requeridos

| Tool | Campos Mínimos | Campos Opcionales |
|------|----------------|-------------------|
| **create_gts_ticket** | `descripcion` | `nombre_contacto`, `telefono_contacto`, `email_contacto`, `tipo`, `prioridad` |
| **activate_emergency_protocol** | `descripcion`, `ubicacion` | `nombre_llamante`, `telefono_llamante`, `tipo_incidente`, `nivel_riesgo` |
| **transfer_to_specialist** | `consulta`, `area` | `nombre_usuario`, `telefono_usuario`, `email_usuario`, `ticket_id` |
| **search_gts_documentation** | `query` | `tipo_proceso`, `usuario_solicitante`, `contexto` |
| **check_system_status** | _(ninguno - GET)_ | _(ninguno)_ |

---

## 🚀 Valores Por Defecto

El sistema rellena automáticamente estos valores si no se proporcionan:

### Tickets:
- `tipo`: "INCIDENCIA_TECNICA"
- `prioridad`: "MEDIA"
- `contacto.nombre`: "Usuario GTS"
- `contacto.telefono`: "No especificado"
- `contacto.email`: "no-especificado@gts.es"
- `contacto.empresa`: "GTS"

### Emergencias:
- `tipo_incidente`: "ANOMALIA_CRITICA"
- `nivel_riesgo`: "MEDIO"
- `contacto_llamante.nombre`: "Usuario GTS"
- `contacto_llamante.telefono`: "900123456"
- `contacto_llamante.empresa`: "Llamante externo"

### Transferencias:
- `datos_usuario.nombre`: "Usuario GTS"
- `datos_usuario.telefono`: "No especificado"
- `datos_usuario.email`: "no-especificado@gts.es"

### Búsquedas:
- `tipo_proceso`: "consulta_general"
- `usuario_solicitante`: "Usuario GTS"
- `contexto`: "Búsqueda desde agente de voz"

---

## 💡 Tips para el Agente de Voz

1. **Usa siempre los payloads mínimos** cuando la información del usuario sea limitada
2. **Rellena campos opcionales** solo si el usuario los proporciona explícitamente
3. **El sistema completa automáticamente** los campos faltantes con valores sensatos
4. **Para emergencias**, solo pide `descripcion` y `ubicacion` inicialmente
5. **Para tickets**, solo necesitas la `descripcion` del problema

---

## 🧪 Prueba Rápida Completa

```bash
# 1. Crear ticket simple
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Problema de acceso"}'

# 2. Activar emergencia simple
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Olor a gas", "ubicacion": "Getafe"}'

# 3. Transferir simple
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"consulta": "Consulta técnica", "area": "Operaciones"}'

# 4. Buscar simple
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -d '{"query": "habilitación"}'

# 5. Estado del sistema
curl http://localhost:3000/api/system/status
```

---

✅ **Ahora los payloads son mucho más simples y el agente puede funcionar con información mínima!**
