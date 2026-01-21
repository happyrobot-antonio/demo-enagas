# Mesa de Servicios GTS - Dashboard en Tiempo Real

Sistema de visualización en tiempo real de las operaciones del agente de voz de Mesa de Servicios GTS de Enagás.

## 🏗️ Arquitectura

- **Frontend**: React + Vite + Tailwind CSS + WebSockets
- **Backend**: Node.js + Express + Socket.IO
- **Base de datos**: PostgreSQL
- **Orquestación**: Docker Compose

## 🚀 Inicio Rápido

### Requisitos previos
- Docker y Docker Compose instalados
- Puerto 3000 (API), 5173 (Frontend) y 5432 (PostgreSQL) disponibles

### Instalación

1. Clonar el repositorio o descargar los archivos

2. Copiar el archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Iniciar todos los servicios con Docker Compose:
```bash
docker-compose up -d --build
```

4. Verificar que los servicios estén corriendo:
```bash
docker-compose ps
```

### Acceso

- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## 📊 Funcionalidades del Dashboard

### 1. Vista General (Home)
- Estadísticas en tiempo real
- Contador de llamadas activas
- Tickets abiertos
- Emergencias activas
- Gráficos de actividad

### 2. Tickets
- Lista de todos los tickets creados
- Filtrado por tipo y prioridad
- Estado de cada ticket
- Detalles completos

### 3. Emergencias
- Mapa visual de emergencias activas
- Clasificación por tipo y nivel de riesgo
- Línea de tiempo
- Ubicaciones en mapa

### 4. Llamadas
- Historial de llamadas
- Duración y estado
- Transferencias realizadas
- Búsquedas de documentación

## 🔌 API Endpoints

### Tickets
- `POST /api/tickets` - Crear ticket
- `GET /api/tickets` - Listar tickets
- `GET /api/tickets/:id` - Ver ticket específico
- `PATCH /api/tickets/:id` - Actualizar ticket

### Emergencias
- `POST /api/emergencies` - Activar protocolo de emergencia
- `GET /api/emergencies` - Listar emergencias
- `GET /api/emergencies/active` - Emergencias activas
- `PATCH /api/emergencies/:id` - Actualizar emergencia

### Especialistas
- `POST /api/transfers` - Registrar transferencia a especialista
- `GET /api/transfers` - Listar transferencias

### Búsquedas
- `POST /api/searches` - Registrar búsqueda en documentación
- `GET /api/searches` - Historial de búsquedas

### Sistema
- `GET /api/system-status` - Estado de sistemas GTS
- `GET /api/stats` - Estadísticas generales

### WebSocket
- Conexión: `ws://localhost:3000`
- Eventos en tiempo real para todas las operaciones

## 🗄️ Estructura de Base de Datos

### Tablas principales:
- `tickets` - Incidencias y consultas
- `emergencies` - Protocolos de emergencia activados
- `transfers` - Transferencias a especialistas
- `documentation_searches` - Búsquedas en documentación
- `system_status` - Estado de sistemas GTS

## 🛠️ Comandos útiles

### Detener servicios
```bash
docker-compose down
```

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f database
```

### Reconstruir servicios
```bash
docker-compose up -d --build
```

### Acceder a la base de datos
```bash
docker-compose exec database psql -U gts_admin -d gts_operations
```

### Resetear base de datos
```bash
docker-compose down -v
docker-compose up -d --build
```

## 🧪 Pruebas de la API

### Crear un ticket de ejemplo:
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Activar emergencia de ejemplo:
```bash
curl -X POST http://localhost:3000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_incidente": "FUGA",
    "ubicacion_completa": "Polígono Industrial Las Américas, Getafe, Madrid",
    "contacto_llamante": {
      "nombre": "Antonio Fernández",
      "telefono": "655432109",
      "empresa": "Gestión de Polígonos"
    },
    "descripcion_situacion": "Olor intenso a gas detectado",
    "nivel_riesgo": "MEDIO"
  }'
```

## 🎨 Tecnologías Utilizadas

### Frontend
- React 18
- Vite
- Tailwind CSS
- Socket.IO Client
- Recharts (gráficos)
- Lucide React (iconos)
- React Router

### Backend
- Node.js
- Express
- Socket.IO
- pg (PostgreSQL client)
- CORS

### Base de datos
- PostgreSQL 15

## 📝 Notas

- Las conexiones WebSocket permiten actualizaciones en tiempo real sin necesidad de recargar
- Todos los datos persisten en PostgreSQL
- El sistema está preparado para producción con health checks y restart policies
- Los logs se pueden monitorear en tiempo real con `docker-compose logs -f`

## 🔐 Seguridad

En producción, asegúrate de:
- Cambiar todas las contraseñas por defecto
- Usar variables de entorno seguras
- Implementar autenticación y autorización
- Usar HTTPS
- Configurar CORS apropiadamente

## 📞 Soporte

Para dudas o problemas, contacta con el equipo de desarrollo.
