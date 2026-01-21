# Estructura del Proyecto - Mesa de Servicios GTS

## 📁 Estructura de Carpetas

```
DEMO ENAGÁS/
│
├── 📄 docker-compose.yml          # Orquestación de servicios
├── 📄 README.md                   # Documentación principal
├── 📄 API_DOCUMENTATION.md        # Documentación completa de la API
├── 📄 USAGE_EXAMPLES.md           # Ejemplos de uso con curl
├── 📄 INTEGRACION_AGENTE_VOZ.md   # Guía de integración del agente
├── 📄 ESTRUCTURA_PROYECTO.md      # Este archivo
│
├── 🔧 start.sh                    # Script de inicio rápido
├── 🔧 stop.sh                     # Script para detener servicios
├── 📝 .gitignore                  # Archivos ignorados por Git
│
├── 📂 database/                   # Base de datos PostgreSQL
│   └── init.sql                   # Schema e inicialización de BD
│
├── 📂 api/                        # Backend Node.js/Express
│   ├── 📄 package.json
│   ├── 📄 Dockerfile
│   ├── 📄 .dockerignore
│   ├── 📄 server.js              # Servidor principal
│   │
│   ├── 📂 config/
│   │   └── database.js           # Configuración PostgreSQL
│   │
│   └── 📂 routes/
│       ├── tickets.js            # Endpoints de tickets
│       ├── emergencies.js        # Endpoints de emergencias
│       ├── transfers.js          # Endpoints de transferencias
│       ├── searches.js           # Endpoints de búsquedas
│       ├── system.js             # Endpoints de estado de sistemas
│       ├── stats.js              # Endpoints de estadísticas
│       └── calls.js              # Endpoints de llamadas
│
└── 📂 frontend/                   # Dashboard React
    ├── 📄 package.json
    ├── 📄 Dockerfile
    ├── 📄 .dockerignore
    ├── 📄 nginx.conf
    ├── 📄 index.html
    ├── 📄 vite.config.js
    ├── 📄 tailwind.config.js
    ├── 📄 postcss.config.js
    │
    └── 📂 src/
        ├── 📄 main.jsx            # Punto de entrada
        ├── 📄 App.jsx             # Componente principal
        ├── 📄 index.css           # Estilos globales
        │
        ├── 📂 context/
        │   └── SocketContext.jsx  # WebSocket context
        │
        ├── 📂 components/
        │   ├── Layout.jsx         # Layout principal
        │   ├── StatCard.jsx       # Tarjeta de estadística
        │   └── Badge.jsx          # Componente badge
        │
        ├── 📂 pages/
        │   ├── Dashboard.jsx      # Página principal
        │   ├── Tickets.jsx        # Página de tickets
        │   ├── Emergencies.jsx    # Página de emergencias
        │   └── Calls.jsx          # Página de llamadas
        │
        └── 📂 utils/
            ├── api.js             # Cliente API
            └── formatters.js      # Utilidades de formato
```

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENTE DE VOZ (OpenAI)                  │
│                                                             │
│  Tools:                                                     │
│  • search_gts_documentation                                 │
│  • create_gts_ticket                                        │
│  • transfer_to_specialist                                   │
│  • activate_emergency_protocol                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     API BACKEND                             │
│              (Node.js + Express + Socket.IO)                │
│                                                             │
│  Endpoints:                                                 │
│  • POST /api/tickets         - Crear tickets                │
│  • POST /api/emergencies     - Activar emergencias          │
│  • POST /api/transfers       - Registrar transferencias     │
│  • POST /api/searches        - Registrar búsquedas          │
│  • GET  /api/stats           - Obtener estadísticas         │
│  • WebSocket eventos         - Tiempo real                  │
│                                                             │
│  Puerto: 3000                                               │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ PostgreSQL                 │ WebSocket
             │                            │
┌────────────▼──────────┐    ┌───────────▼───────────────────┐
│   BASE DE DATOS       │    │    FRONTEND DASHBOARD         │
│   (PostgreSQL)        │    │   (React + Vite + Tailwind)   │
│                       │    │                               │
│  Tablas:              │    │  Páginas:                     │
│  • tickets            │    │  • Dashboard (Vista general)  │
│  • emergencies        │    │  • Tickets (Gestión)          │
│  • transfers          │    │  • Emergencies (Alertas)      │
│  • calls              │    │  • Calls (Llamadas)           │
│  • documentation_     │    │                               │
│    searches           │    │  Actualizaciones en tiempo    │
│  • system_status      │    │  real vía WebSocket           │
│                       │    │                               │
│  Puerto: 5432         │    │  Puerto: 5173 (dev)           │
└───────────────────────┘    │         80 (prod)             │
                             └───────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1. Creación de Ticket

```
Agente de Voz
    │
    │ 1. Usuario reporta incidencia
    │
    ▼
create_gts_ticket()
    │
    │ 2. POST /api/tickets
    │
    ▼
API Backend
    │
    │ 3. INSERT en PostgreSQL
    │
    ▼
Base de Datos
    │
    │ 4. Ticket creado con número GTS-2026-XXXXX
    │
    ▼
API Backend
    │
    │ 5. Emitir evento 'ticket:created' vía WebSocket
    │
    ▼
Dashboard Frontend
    │
    │ 6. Actualización en tiempo real
    │
    ▼
Usuario ve el ticket instantáneamente
```

### 2. Activación de Emergencia

```
Agente de Voz
    │
    │ 1. Detecta emergencia (fuga, daño)
    │
    ▼
activate_emergency_protocol()
    │
    │ 2. POST /api/emergencies
    │
    ▼
API Backend
    │
    │ 3. INSERT en PostgreSQL
    │ 4. Genera código EMG-2026-XXXXX
    │ 5. Calcula ETA según nivel de riesgo
    │
    ▼
Base de Datos
    │
    ▼
API Backend
    │
    │ 6. Emitir alerta 'emergency:activated'
    │
    ▼
Dashboard Frontend
    │
    │ 7. ALERTA ROJA visible
    │ 8. Notificación del navegador
    │ 9. Sonido de alerta (opcional)
    │
    ▼
Operadores notificados instantáneamente
```

---

## 🗄️ Esquema de Base de Datos

### Tabla: `tickets`
```sql
- id (UUID, PK)
- numero_ticket (VARCHAR, UNIQUE) -- Auto: GTS-YYYY-XXXXX
- tipo (VARCHAR) -- INCIDENCIA_TECNICA, CONSULTA_ESPECIALIZADA, RECLAMACION
- descripcion (TEXT)
- usuario_afectado (VARCHAR)
- sistema (VARCHAR)
- prioridad (VARCHAR) -- BAJA, MEDIA, ALTA, CRITICA
- estado (VARCHAR) -- ABIERTO, EN_PROCESO, RESUELTO, CERRADO
- contacto (JSONB)
- created_at, updated_at, resolved_at (TIMESTAMP)
```

### Tabla: `emergencies`
```sql
- id (UUID, PK)
- codigo_emergencia (VARCHAR, UNIQUE) -- Auto: EMG-YYYY-XXXXX
- tipo_incidente (VARCHAR) -- FUGA, DAÑO_INFRAESTRUCTURA, etc.
- ubicacion_completa (TEXT)
- nivel_riesgo (VARCHAR) -- BAJO, MEDIO, ALTO, CRITICO
- descripcion_situacion (TEXT)
- contacto_llamante (JSONB)
- estado (VARCHAR) -- ACTIVA, EN_ATENCION, CONTROLADA, RESUELTA
- tiempo_estimado_llegada (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

### Tabla: `transfers`
```sql
- id (UUID, PK)
- area_destino (VARCHAR)
- resumen_consulta (TEXT)
- datos_usuario (JSONB)
- estado (VARCHAR) -- PENDIENTE, TRANSFERIDO, etc.
- ticket_id (UUID, FK)
- created_at, updated_at (TIMESTAMP)
```

### Tabla: `calls`
```sql
- id (UUID, PK)
- nombre_llamante (VARCHAR)
- empresa (VARCHAR)
- telefono (VARCHAR)
- tipo_consulta (VARCHAR)
- estado (VARCHAR)
- duracion_segundos (INTEGER)
- started_at, ended_at (TIMESTAMP)
```

### Tabla: `documentation_searches`
```sql
- id (UUID, PK)
- query (TEXT)
- tipo_proceso (VARCHAR)
- resultados_count (INTEGER)
- documentos_encontrados (JSONB)
- created_at (TIMESTAMP)
```

### Tabla: `system_status`
```sql
- id (UUID, PK)
- sistema (VARCHAR)
- estado (VARCHAR) -- OPERATIVO, DEGRADADO, MANTENIMIENTO, CAIDO
- mensaje (TEXT)
- mantenimiento_programado (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

---

## 🌐 Puertos y URLs

| Servicio   | Puerto | URL Local                      | Descripción                |
|------------|--------|--------------------------------|----------------------------|
| Frontend   | 5173   | http://localhost:5173          | Dashboard React            |
| Frontend   | 80     | http://localhost:80 (prod)     | Dashboard Nginx (prod)     |
| API        | 3000   | http://localhost:3000          | Backend REST + WebSocket   |
| PostgreSQL | 5432   | localhost:5432                 | Base de datos              |

---

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js 18** - Runtime
- **Express** - Framework web
- **Socket.IO** - WebSockets en tiempo real
- **pg** - Cliente PostgreSQL
- **CORS** - Control de acceso

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Socket.IO Client** - WebSockets
- **React Router** - Navegación
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas

### Base de Datos
- **PostgreSQL 15** - Base de datos relacional
- **UUID** - IDs únicos
- **JSONB** - Datos estructurados flexibles
- **Triggers** - Auto-numeración y timestamps

### DevOps
- **Docker** - Contenedorización
- **Docker Compose** - Orquestación
- **Nginx** - Servidor web (producción)

---

## 📊 Características Principales

### ✅ Tiempo Real
- WebSocket para actualizaciones instantáneas
- Sin necesidad de recargar la página
- Notificaciones del navegador para emergencias

### ✅ Visual y Sencillo
- Dashboard limpio y moderno
- Tarjetas de estadísticas destacadas
- Colores por prioridad/riesgo
- Búsqueda y filtros intuitivos

### ✅ Escalable
- Arquitectura de microservicios
- Base de datos relacional robusta
- API REST estándar
- Docker para fácil despliegue

### ✅ Completo
- Todas las tools del agente integradas
- Historial completo de operaciones
- Estadísticas y métricas
- Estado de sistemas en tiempo real

---

## 🚀 Comandos Rápidos

```bash
# Iniciar todo
./start.sh

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f database

# Reiniciar un servicio
docker-compose restart api

# Detener todo
./stop.sh

# Reconstruir
docker-compose up -d --build

# Eliminar todo (incluyendo datos)
docker-compose down -v
```

---

## 📝 Variables de Entorno

Ver archivo `.env` (crear desde `.env.example`):

```bash
# Base de datos
POSTGRES_DB=gts_operations
POSTGRES_USER=gts_admin
POSTGRES_PASSWORD=gts_secure_pass_2026

# API
NODE_ENV=development
PORT=3000
DB_HOST=database
DB_PORT=5432

# Frontend
VITE_API_URL=http://localhost:3000
```

---

## 🧪 Testing

### Prueba rápida
```bash
# Health check
curl http://localhost:3000/health

# Crear ticket de prueba
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INCIDENCIA_TECNICA",
    "descripcion": "Test",
    "contacto": {"nombre": "Test", "email": "test@test.com"},
    "prioridad": "MEDIA"
  }'

# Ver estadísticas
curl http://localhost:3000/api/stats | jq
```

---

## 📚 Documentación Completa

- **README.md** - Introducción y guía de inicio
- **API_DOCUMENTATION.md** - Todos los endpoints de la API
- **USAGE_EXAMPLES.md** - Ejemplos prácticos con curl
- **INTEGRACION_AGENTE_VOZ.md** - Integración con el agente
- **ESTRUCTURA_PROYECTO.md** - Este archivo

---

## 🎯 Próximos Pasos

1. **Iniciar el sistema**: `./start.sh`
2. **Abrir el dashboard**: http://localhost:5173
3. **Probar la API**: Ver `USAGE_EXAMPLES.md`
4. **Integrar el agente**: Ver `INTEGRACION_AGENTE_VOZ.md`

---

## 💡 Arquitectura de Componentes Frontend

```
App.jsx (Router)
│
├─ Layout.jsx (Header + Navigation + Footer)
│   │
│   └─ {children} → Páginas
│
├─ Dashboard.jsx
│   ├─ StatCard × 4 (Estadísticas)
│   ├─ Emergencias Activas
│   ├─ Tickets Recientes
│   └─ Estado de Sistemas
│
├─ Tickets.jsx
│   ├─ Búsqueda + Filtros
│   └─ Tabla de Tickets
│
├─ Emergencies.jsx
│   ├─ Filtros
│   └─ Lista de Emergencias (Cards)
│
└─ Calls.jsx
    ├─ Filtros
    └─ Tabla de Llamadas

SocketContext (Provider)
├─ Conexión WebSocket
├─ Listeners de eventos
└─ Estado global (stats, nuevos items)
```

---

¡Sistema completo y listo para usar! 🎉
