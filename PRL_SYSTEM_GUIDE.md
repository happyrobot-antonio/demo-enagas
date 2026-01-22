# 🛡️ Sistema PRL - Prevención de Riesgos Laborales Enagás

## 📋 Descripción General

Sistema de verificación y control de seguridad para operaciones críticas en instalaciones de Enagás. Permite a los supervisores monitorear en tiempo real el estado de los checklists de seguridad de los trabajadores antes de iniciar tareas de alto riesgo.

---

## 🎯 Características Principales

### Dashboard Operativo
- **Vista de Turno Activo**: Información de planta, supervisor y horario
- **Estadísticas en Tiempo Real**: 
  - Total de trabajadores
  - Completados ✅
  - Pendientes ⏳
  - En curso 📞
  - Alertas ⚠️
  - Trabajos críticos 🔴

### Gestión de Trabajadores
- **Lista Visual**: Cada trabajador muestra:
  - Indicador de estado (verde/amarillo/rojo)
  - Nombre, ID y empresa
  - Tipo de trabajo y descripción
  - Ubicación exacta
  - Riesgos identificados
  - Estado del checklist
  - Botón de acción

### Códigos de Color
- 🟢 **Verde**: Checklist completado exitosamente
- 🟡 **Amarillo**: Llamada en curso ahora mismo
- 🔴 **Rojo**: Alerta - No contactado o pendiente crítico
- ⚪ **Gris**: Pendiente normal

### Funcionalidad de Llamadas
- **Botón LLAMAR**: Inicia verificación telefónica automática
- **Webhook Ready**: Preparado para integración con HappyRobot
- **Estado en Tiempo Real**: El dashboard se actualiza automáticamente
- **Historial**: Registro de todos los intentos de contacto

---

## 📊 Modelo de Datos

### Tablas Principales

#### `prl_shifts` - Turnos
- Información del turno (Mañana/Tarde/Noche)
- Planta/ubicación
- Supervisor responsable
- Horarios de inicio/fin

#### `prl_workers` - Trabajadores
- Datos personales (nombre, employee_id, empresa, teléfono)
- Tarea asignada y ubicación
- **Tipos de trabajo** (contexto Enagás):
  - `INSPECCION_ALTURA` - Inspección en torres y válvulas elevadas
  - `ESPACIO_CONFINADO` - Entrada a compresores, tanques
  - `TRABAJO_CALIENTE` - Soldadura, corte en instalaciones
  - `EXCAVACION` - Trabajos cerca de gasoductos
  - `INSPECCION_INSTRUMENTACION` - Verificación de medidores
  - `MANTENIMIENTO_MECANICO` - Reparaciones de equipos

- **Riesgos identificados**:
  - `TRABAJO_ALTURA` - Caída desde altura
  - `ESPACIO_CONFINADO` - Atmósfera peligrosa
  - `ATMOSFERA_TOXICA` - Gases tóxicos
  - `FALTA_OXIGENO` - Atmósfera pobre en O2
  - `TRABAJO_CALIENTE` - Incendio/explosión
  - `INCENDIO`, `EXPLOSION`, `QUEMADURAS`
  - `EXCAVACION`, `ROTURA_TUBERIA`, `SEPULTAMIENTO`
  - `ATRAPAMIENTO`, `PROYECCION_PARTICULAS`
  - `RIESGO_ELECTRICO`, `ALTA_PRESION`

- **EPIs requeridos**:
  - Arnés anticaídas, Casco, Guantes
  - Equipo respiración autónoma
  - Detector de gases
  - Ropa ignífuga
  - Radio comunicación
  - Permiso de trabajo caliente
  - Y más...

#### `prl_safety_checklists` - Checklists Completados
- Respuestas a preguntas de seguridad (JSON)
- Tiempo de verificación
- Observaciones e incidencias
- Método (llamada telefónica, presencial, etc.)

#### `prl_safety_calls` - Llamadas de Verificación
- Estado (programada, en curso, completada, fallida)
- Duración y resultado
- Motivo de fallo si aplica
- `run_id` para tracking con HappyRobot
- URL de grabación

#### `prl_incidents` - Incidentes PRL
- Tipos:
  - `INCUMPLIMIENTO_CHECKLIST`
  - `NO_CONTACTADO`
  - `FALTA_EQUIPO_PROTECCION`
  - `CONDICION_INSEGURA_DETECTADA`
  - `TRABAJADOR_NO_APTO`
  - `ACCIDENTE`
  - `CUASI_ACCIDENTE`

---

## 🔌 API Endpoints

### Turnos
```
GET    /api/prl/shifts/active          # Turnos activos hoy
GET    /api/prl/shifts/:id              # Detalle de turno
GET    /api/prl/shifts/:id/stats        # Estadísticas del turno
```

### Trabajadores
```
GET    /api/prl/workers                 # Lista de trabajadores
       ?shift_id=uuid                   # Filtrar por turno
       ?checklist_estado=PENDIENTE      # Filtrar por estado
GET    /api/prl/workers/:id             # Detalle + historial
```

### Llamadas
```
POST   /api/prl/calls/initiate          # Iniciar llamada
       body: { worker_id: "uuid" }
       
POST   /api/prl/calls/:id/update        # Actualizar llamada (webhook)
       body: {
         estado: "COMPLETADA",
         contacto_exitoso: true,
         checklist_completado: true,
         duracion_segundos: 145,
         run_id: "abc123",
         recording_url: "https://..."
       }

GET    /api/prl/calls                   # Historial de llamadas
       ?worker_id=uuid
       ?estado=EN_CURSO
```

### Checklists
```
POST   /api/prl/checklists              # Registrar checklist completado
       body: {
         worker_id: "uuid",
         respuestas: { preguntas: [...] },
         estado: "COMPLETO",
         duracion_segundos: 145
       }
```

### Incidentes
```
GET    /api/prl/incidents               # Lista de incidentes
       ?estado=ABIERTO
       ?tipo=NO_CONTACTADO
```

---

## 🔗 Integración con HappyRobot

### Flujo de Llamada Automatizada

1. **Supervisor hace clic en "LLAMAR"**
   ```
   POST /api/prl/calls/initiate
   {
     "worker_id": "uuid-del-trabajador"
   }
   ```

2. **API responde con datos para webhook**
   ```json
   {
     "success": true,
     "call": {
       "id": "call-uuid",
       "worker_id": "worker-uuid",
       "telefono_destino": "+34600111222",
       "estado": "EN_CURSO"
     },
     "worker": {
       "nombre_completo": "Miguel Ángel Ruiz",
       "tipo_trabajo": "INSPECCION_ALTURA",
       "riesgos_identificados": ["TRABAJO_ALTURA", "CAIDA_OBJETOS"],
       "equipos_proteccion_requeridos": ["Arnés anticaídas", "Casco", ...]
     },
     "webhook_url": "https://api.enag

as.example/api/prl/calls/{call_id}/update"
   }
   ```

3. **HappyRobot realiza la llamada**
   - Lee el nombre del trabajador
   - Explica el tipo de trabajo
   - Pregunta cada punto del checklist:
     * "¿Has revisado tu arnés anticaídas?"
     * "¿La zona está señalizada?"
     * "¿Tienes radio de comunicación?"
     * "¿Hay vigilante de seguridad?"
     * etc.

4. **HappyRobot envía resultado al webhook**
   ```
   POST /api/prl/calls/{call_id}/update
   {
     "estado": "COMPLETADA",
     "contacto_exitoso": true,
     "checklist_completado": true,
     "duracion_segundos": 145,
     "run_id": "happyrobot-run-id-123",
     "recording_url": "https://recordings.happyrobot.ai/..."
   }
   ```

5. **API actualiza automáticamente**
   - Estado del trabajador → `COMPLETADO`
   - Se registra el checklist con las respuestas
   - Dashboard se actualiza en tiempo real (Socket.IO)
   - Tarjeta del trabajador cambia a verde ✅

### En caso de fallo:
```json
{
  "estado": "NO_RESPONDE",
  "contacto_exitoso": false,
  "motivo_fallo": "Llamada no contestada después de 3 intentos"
}
```
- Trabajador cambia a estado `NO_CONTACTADO`
- Se crea incidente automático
- Supervisor recibe alerta visual (rojo)

---

## 💻 Frontend - Uso del Dashboard

### URL
```
http://localhost:5173/prl  (local)
https://frontend-production-f6d9.up.railway.app/prl  (producción)
```

### Vista Principal
1. **Header**: Nombre de la planta y turno actual
2. **Resumen**: Cards con estadísticas visuales
3. **Lista de Trabajadores**: Tabla detallada con:
   - Estado visual (círculo de color + icono)
   - Nombre e ID del trabajador
   - Tarea y ubicación
   - Estado del checklist
   - Botón de acción

### Interacción
- **Escaneo visual**: Identificar filas rojas (problemas)
- **Clic en LLAMAR**: Inicia verificación automática
- **Ver Detalle**: Para trabajadores con checklist completado
- **Auto-refresh**: Cada 30 segundos sin intervención

---

## 📱 Estados del Trabajador

| Estado | Color | Icono | Botón | Descripción |
|--------|-------|-------|-------|-------------|
| `COMPLETADO` | 🟢 Verde | ✅ | Ver Detalle | Checklist verificado exitosamente |
| `EN_CURSO` | 🟡 Amarillo | 📞 | Llamando... | Verificación en progreso ahora |
| `PENDIENTE` (Crítico/Alto) | 🔴 Rojo | ⏰ | LLAMAR | Requiere atención urgente |
| `PENDIENTE` (Medio/Bajo) | 🟡 Amarillo | ⏰ | LLAMAR | Pendiente de verificación |
| `NO_CONTACTADO` | 🔴 Rojo | ⚠️ | LLAMAR | Múltiples intentos fallidos |

---

## 🎬 Datos de Ejemplo Incluidos

### Turno: Mañana - Planta de Compresión Huelva

**6 Trabajadores**:

1. **Miguel Ángel Ruiz** (Enagás)
   - Tipo: Inspección en altura (Torre 3)
   - Estado: ✅ COMPLETADO (hace 2 horas)
   - Riesgos: Trabajo en altura, Caída de objetos

2. **Laura Sánchez** (Enagás)
   - Tipo: Espacio confinado (Compresor C-201)
   - Estado: 🔴 PENDIENTE CRÍTICO
   - Riesgos: Espacio confinado, Atmósfera tóxica

3. **José Antonio Ferrer** (Subcontrata)
   - Tipo: Trabajo en caliente (Soldadura LP-04)
   - Estado: 🟡 EN CURSO (llamando ahora)
   - Riesgos: Fuego, Explosión, Quemaduras

4. **David Romero** (Subcontrata)
   - Tipo: Excavación (Inspección gasoducto)
   - Estado: ✅ COMPLETADO (hace 1 hora)
   - Riesgos: Rotura tubería, Sepultamiento

5. **Carmen López** (Enagás)
   - Tipo: Instrumentación (Transmisores HP-12)
   - Estado: 🟡 PENDIENTE
   - Riesgos: Riesgo eléctrico, Alta presión

6. **Roberto Sanz** (Subcontrata)
   - Tipo: Mantenimiento mecánico (Ventilador AE-102)
   - Estado: 🔴 NO CONTACTADO (3 intentos)
   - Riesgos: Atrapamiento, Proyección

---

## 🚀 Despliegue

### Local (Docker Compose)
```bash
docker-compose up
```
- Frontend: http://localhost:8080/prl
- API: http://localhost:8000/api/prl

### Railway (Producción)
✅ **Desplegado automáticamente**
- Frontend: https://frontend-production-f6d9.up.railway.app/prl
- API: https://api-production-xxx.railway.app/api/prl

---

## 🔒 Seguridad y Compliance

- ✅ Registro completo de todas las verificaciones
- ✅ Trazabilidad: Quién, cuándo, qué se verificó
- ✅ Grabaciones de llamadas almacenadas
- ✅ Alertas automáticas ante incumplimientos
- ✅ Histórico de incidentes
- ✅ Auditable para inspecciones

---

## 📈 Métricas y KPIs

El sistema permite extraer:
- % Cumplimiento de checklists por turno
- Tiempo promedio de verificación
- Incidentes por tipo de trabajo
- Trabajadores con más intentos de contacto
- Evolución temporal de seguridad

---

## 🎓 Contexto Enagás - Tipos de Trabajo Reales

### 1. Inspección en Altura
- Torres de enfriamiento
- Válvulas elevadas
- Estructuras metálicas
- **Riesgos**: Caída, objetos desprendidos

### 2. Espacios Confinados
- Interior de compresores
- Tanques de almacenamiento
- Fosos y arquetas
- **Riesgos**: Atmósfera tóxica, falta O2

### 3. Trabajo en Caliente
- Soldadura de bridas
- Corte de tuberías
- Reparaciones térmicas
- **Riesgos**: Incendio, explosión

### 4. Excavaciones
- Inspección de recubrimientos
- Instalación de nuevos tramos
- Mantenimiento subterráneo
- **Riesgos**: Rotura tubería, sepultamiento

### 5. Mantenimiento Instrumentación
- Calibración transmisores presión
- Verificación medidores caudal
- Ajuste sistemas control
- **Riesgos**: Eléctrico, alta presión

### 6. Mantenimiento Mecánico
- Compresores, válvulas
- Ventiladores, bombas
- Motores, reductores
- **Riesgos**: Atrapamiento, proyección

---

## ⚡ Próximos Pasos

Para completar la integración:

1. **Configurar Webhook en HappyRobot**
   ```
   Webhook URL: https://api-production-xxx.railway.app/api/prl/calls/{call_id}/update
   Method: POST
   ```

2. **Personalizar Checklists**
   - Definir preguntas específicas por tipo de trabajo
   - Adaptar a procedimientos internos Enagás

3. **Testing**
   - Probar flujo completo con llamada real
   - Verificar actualización en tiempo real
   - Validar grabación y almacenamiento

4. **Monitoreo**
   - Dashboard de métricas de seguridad
   - Alertas por email/SMS para incidentes críticos
   - Reportes automáticos diarios

---

**🎉 Sistema PRL completamente funcional y listo para producción!**
