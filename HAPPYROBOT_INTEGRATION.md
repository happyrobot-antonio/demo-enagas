# 🤖 Integración HappyRobot - Sistema PRL

## 🎯 Descripción

El sistema PRL está integrado con HappyRobot para realizar llamadas automáticas de verificación de seguridad a los trabajadores antes de iniciar tareas de alto riesgo.

---

## 🔄 Flujo Completo

### 1. Inicio de Llamada (Frontend)

```javascript
// Usuario hace clic en botón [LLAMAR]
const handleCall = async (workerId) => {
  // 1. Disparar webhook de HappyRobot
  const webhookResponse = await fetch(
    'https://workflows.platform.happyrobot.ai/hooks/xvjhfhj8fgho',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id: workerId })
    }
  )
  
  // 2. Recibir run_id
  const { queued_run_ids } = await webhookResponse.json()
  const runId = queued_run_ids[0]
  
  // 3. Registrar en backend
  await api.post('/api/prl/calls/initiate', {
    worker_id: workerId,
    happyrobot_run_id: runId
  })
}
```

### 2. Webhook de HappyRobot

**URL**: `https://workflows.platform.happyrobot.ai/hooks/xvjhfhj8fgho`

**Request**:
```json
{
  "worker_id": "uuid-del-trabajador"
}
```

**Response**:
```json
{
  "queued_run_ids": ["19184e4c-74ca-474a-8978-e77f5a661e4f"],
  "status": "queued 1 parallel sequences, 0 failed"
}
```

### 3. Registro en Backend

**Endpoint**: `POST /api/prl/calls/initiate`

**Request**:
```json
{
  "worker_id": "uuid-del-trabajador",
  "happyrobot_run_id": "19184e4c-74ca-474a-8978-e77f5a661e4f"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Llamada iniciada",
  "call": {
    "id": "uuid-de-la-llamada",
    "worker_id": "uuid-del-trabajador",
    "call_id": "19184e4c-74ca-474a-8978-e77f5a661e4f",
    "estado": "EN_CURSO",
    ...
  },
  "happyrobot_run_id": "19184e4c-74ca-474a-8978-e77f5a661e4f",
  "happyrobot_tracking_url": "https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=19184e4c-74ca-474a-8978-e77f5a661e4f"
}
```

---

## 📊 Tracking de Estado

### API de HappyRobot

**Endpoint**: `GET /api/prl/calls/:callId/happyrobot-status`

**Descripción**: Consulta el estado actual de una llamada en HappyRobot.

**Headers (hardcodeados en backend)**:
```
authorization: Bearer 642ce338577da316e92acd557a8e17e6
x-organization-id: 01973c47-56ec-7401-a0b2-786431d5f1f2
```

**Example Request**:
```bash
curl http://localhost:3000/api/prl/calls/uuid-de-la-llamada/happyrobot-status
```

**Response**:
```json
{
  "success": true,
  "call_id": "uuid-de-la-llamada",
  "happyrobot_run_id": "19184e4c-74ca-474a-8978-e77f5a661e4f",
  "happyrobot_status": {
    "id": "19184e4c-74ca-474a-8978-e77f5a661e4f",
    "status": "running",
    "started_at": "2026-01-22T10:00:00Z",
    "outputs": {},
    ...
  },
  "local_call_data": {
    "id": "uuid-de-la-llamada",
    "estado": "EN_CURSO",
    ...
  }
}
```

### Consulta Directa a HappyRobot

También puedes consultar directamente:

```bash
curl --request GET \
  --url https://platform.happyrobot.ai/api/v1/runs/19184e4c-74ca-474a-8978-e77f5a661e4f \
  --header 'authorization: Bearer 642ce338577da316e92acd557a8e17e6' \
  --header 'x-organization-id: 01973c47-56ec-7401-a0b2-786431d5f1f2'
```

---

## 🗄️ Base de Datos

### Tabla: `prl_safety_calls`

El `run_id` de HappyRobot se almacena en el campo `call_id`:

```sql
CREATE TABLE prl_safety_calls (
    id UUID PRIMARY KEY,
    worker_id UUID REFERENCES prl_workers(id),
    
    -- Datos de la llamada
    telefono_destino VARCHAR(50),
    estado VARCHAR(30), -- 'PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'FALLIDA'
    
    -- HappyRobot integration
    call_id VARCHAR(255), -- ← HappyRobot run_id almacenado aquí
    run_id VARCHAR(255),
    recording_url TEXT,
    
    -- Timestamps
    iniciada_at TIMESTAMP,
    finalizada_at TIMESTAMP,
    duracion_segundos INTEGER,
    
    ...
);
```

### Consulta SQL para obtener llamadas con run_id

```sql
SELECT 
    c.id,
    c.call_id as happyrobot_run_id,
    c.estado,
    c.iniciada_at,
    w.nombre_completo,
    w.employee_id,
    w.tipo_trabajo
FROM prl_safety_calls c
JOIN prl_workers w ON c.worker_id = w.id
WHERE c.call_id IS NOT NULL
ORDER BY c.iniciada_at DESC;
```

---

## 🔗 URLs Importantes

### Webhook de Ejecución
```
https://workflows.platform.happyrobot.ai/hooks/xvjhfhj8fgho
```

### Tracking de Ejecución (UI)
```
https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id={run_id}
```

### API de Estado
```
https://platform.happyrobot.ai/api/v1/runs/{run_id}
```

---

## 🧪 Testing

### 1. Probar Webhook Directamente

```bash
curl -X POST https://workflows.platform.happyrobot.ai/hooks/xvjhfhj8fgho \
  -H "Content-Type: application/json" \
  -d '{"worker_id": "test-worker-123", "test": true}'
```

**Respuesta esperada**:
```json
{
  "queued_run_ids": ["uuid-generado"],
  "status": "queued 1 parallel sequences, 0 failed"
}
```

### 2. Probar desde Frontend

1. Abre el dashboard PRL: `http://localhost:8080/prl`
2. Haz clic en botón rojo [LLAMAR] de un trabajador pendiente
3. Abre la consola del navegador (F12)
4. Verifica logs:
   ```
   HappyRobot webhook response: {queued_run_ids: [...], status: "..."}
   ```
5. La llamada debe cambiar a estado "EN_CURSO"

### 3. Verificar en Base de Datos

```bash
docker run --rm -i postgres:15-alpine psql $DATABASE_URL << 'EOF'
SELECT 
    c.id,
    c.call_id as happyrobot_run_id,
    c.estado,
    w.nombre_completo
FROM prl_safety_calls c
JOIN prl_workers w ON c.worker_id = w.id
WHERE c.call_id IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 5;
EOF
```

### 4. Consultar Estado en HappyRobot

```bash
# Reemplaza {run_id} con el run_id real
curl --request GET \
  --url https://platform.happyrobot.ai/api/v1/runs/{run_id} \
  --header 'authorization: Bearer 642ce338577da316e92acd557a8e17e6' \
  --header 'x-organization-id: 01973c47-56ec-7401-a0b2-786431d5f1f2' \
  | jq '.'
```

---

## 🐛 Troubleshooting

### Error: "No se recibió run_id del webhook"

**Causa**: El webhook no devolvió el formato esperado.

**Solución**:
1. Verifica que el webhook esté activo en HappyRobot
2. Prueba el webhook directamente con curl
3. Revisa los logs del navegador para ver la respuesta exacta

### Error: "HappyRobot API error: 401"

**Causa**: Token de autorización inválido o expirado.

**Solución**:
1. Verifica que el token esté correcto en `api/routes/prl.js`
2. Genera un nuevo token desde HappyRobot si es necesario
3. Actualiza el token en el código

### Error: CORS en navegador

**Causa**: El webhook de HappyRobot podría no aceptar requests desde el navegador.

**Solución**:
Si ocurre, mueve la llamada al webhook al backend:
1. Frontend llama a backend: `POST /api/prl/calls/initiate` con solo `worker_id`
2. Backend llama al webhook de HappyRobot
3. Backend registra la llamada con el `run_id` recibido

---

## 📋 Checklist de Integración

- [x] Webhook de HappyRobot configurado
- [x] Frontend dispara webhook al hacer clic en [LLAMAR]
- [x] Frontend captura `run_id` de respuesta
- [x] Backend almacena `run_id` en `call_id`
- [x] Endpoint de tracking implementado
- [x] Headers de autorización hardcodeados
- [ ] Webhook callback para actualizar estado (opcional)
- [ ] Polling automático del estado (opcional)
- [ ] UI para mostrar estado de llamada en tiempo real (opcional)

---

## 🔮 Mejoras Futuras

1. **Polling Automático**: Consultar automáticamente el estado cada X segundos
2. **Webhook Callback**: HappyRobot notifica cuando termina la llamada
3. **UI de Estado**: Mostrar estado detallado en el dashboard (duración, transcripción, etc.)
4. **Reintentos**: Lógica para reintentar llamadas fallidas
5. **Analytics**: Dashboard de métricas de llamadas (duración promedio, tasa de éxito, etc.)

---

**🎉 La integración está completa y lista para usar!** 🤖✨
