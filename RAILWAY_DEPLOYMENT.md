# Guía de Despliegue en Railway

## 🚂 Estructura del Proyecto en Railway

Este proyecto tiene 3 componentes que deben desplegarse como **servicios separados** en Railway:

1. **PostgreSQL Database** (Plugin de Railway)
2. **API Backend** (carpeta `/api`)
3. **Frontend Dashboard** (carpeta `/frontend`)

## 📋 Pasos de Despliegue

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza y selecciona tu repositorio

### 2. Añadir PostgreSQL Database

1. En tu proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway creará automáticamente la base de datos
4. **Importante**: Copia las variables de conexión (las usarás después)

### 3. Desplegar el API Backend

#### Crear el Servicio
1. Click en "+ New" → "GitHub Repo"
2. Selecciona el mismo repositorio
3. Railway creará un nuevo servicio

#### Configurar el Root Directory
1. Ve a "Settings" del servicio API
2. En "Root Directory" escribe: `/api`
3. En "Build Command" (opcional, Railway lo detecta): `npm install`
4. En "Start Command" (opcional): `node server.js`

#### Variables de Entorno
En la pestaña "Variables", añade:

```
NODE_ENV=production
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
PORT=${{PORT}}
```

**Nota**: Railway asigna automáticamente `${{PORT}}`, y las variables `${{Postgres.*}}` se referencian del servicio PostgreSQL.

#### Modificación Necesaria en `api/server.js`
Asegúrate de que el servidor use la variable PORT de Railway:

```javascript
const PORT = process.env.PORT || 3000
```

### 4. Desplegar el Frontend

#### Crear el Servicio
1. Click en "+ New" → "GitHub Repo"
2. Selecciona el mismo repositorio
3. Railway creará otro servicio

#### Configurar el Root Directory
1. Ve a "Settings" del servicio Frontend
2. En "Root Directory" escribe: `/frontend`
3. **Importante**: En "Builder" selecciona "Dockerfile" (no Nixpacks)

#### Variables de Entorno
En la pestaña "Variables", añade:

```
VITE_API_URL=https://${{API.RAILWAY_PUBLIC_DOMAIN}}
```

**Nota**: `${{API.RAILWAY_PUBLIC_DOMAIN}}` referencia la URL pública del servicio API.

#### Configuración del Dockerfile
El `Dockerfile` en `/frontend` ya está configurado para recibir `VITE_API_URL` como build argument, así que funcionará automáticamente.

### 5. Inicializar la Base de Datos

Después del primer despliegue, necesitas ejecutar el script SQL para crear las tablas:

#### Opción A: Usando Railway CLI
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Conectar a PostgreSQL
railway connect Postgres

# Ejecutar el script
\i /path/to/database/init.sql
```

#### Opción B: Usando pgAdmin o DBeaver
1. Copia las credenciales de PostgreSQL desde Railway
2. Conéctate con tu cliente SQL favorito
3. Ejecuta el contenido de `database/init.sql`

#### Opción C: Desde el API (Automático)
Puedes modificar `api/server.js` para ejecutar el script en el primer arranque, pero esto es opcional.

## 🔗 Conectar los Servicios

Railway automáticamente conectará los servicios si usas las referencias de variables:

- Frontend → API: `VITE_API_URL` apunta al dominio público del API
- API → Database: Variables `${{Postgres.*}}` apuntan a la base de datos

## 📊 Estructura Final en Railway

```
Mi Proyecto Railway
├── PostgreSQL (Plugin)
│   └── Variables: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
│
├── gts-api (Servicio)
│   ├── Root Directory: /api
│   ├── Builder: Nixpacks (Node.js)
│   └── Variables: DB_*, PORT
│
└── gts-frontend (Servicio)
    ├── Root Directory: /frontend
    ├── Builder: Dockerfile
    └── Variables: VITE_API_URL
```

## ⚙️ Configuraciones Adicionales

### CORS en el API
Asegúrate de que el API acepta peticiones del dominio del frontend:

```javascript
// En api/server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}
app.use(cors(corsOptions))
```

Añade en las variables del API:
```
FRONTEND_URL=https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### Dominios Personalizados (Opcional)
1. Ve a "Settings" de cada servicio
2. En "Domains" → "Generate Domain" o añade tu dominio personalizado
3. Actualiza las variables de entorno con los nuevos dominios

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que las variables `${{Postgres.*}}` estén correctamente referenciadas
- Asegúrate de que el servicio API tiene acceso al servicio PostgreSQL

### Error: "API calls failing from frontend"
- Verifica que `VITE_API_URL` apunte al dominio público del API
- Revisa la configuración CORS en el API
- Asegúrate de que el API está corriendo (check logs)

### Error: "Build failed"
- Verifica que el "Root Directory" esté correctamente configurado
- Revisa los logs de build en Railway
- Asegúrate de que `package.json` existe en el root directory

## 📝 Checklist de Despliegue

- [ ] Crear proyecto en Railway
- [ ] Añadir PostgreSQL plugin
- [ ] Desplegar API con root directory `/api`
- [ ] Configurar variables de entorno del API
- [ ] Desplegar Frontend con root directory `/frontend`
- [ ] Configurar variables de entorno del Frontend
- [ ] Inicializar base de datos con `init.sql`
- [ ] Verificar que todos los servicios están "Active"
- [ ] Probar la aplicación en el dominio del Frontend
- [ ] Configurar dominios personalizados (opcional)

## 🚀 URLs Finales

Después del despliegue, tendrás:

- **Frontend**: `https://gts-frontend-production.up.railway.app`
- **API**: `https://gts-api-production.up.railway.app`
- **Database**: Acceso interno (no público)

## 💰 Costos

Railway ofrece:
- **$5 de crédito gratis al mes** (Hobby Plan)
- **$0.000231/GB-hour** para recursos
- **$0.000463/vCPU-hour** para compute

Estimación para este proyecto: ~$3-5/mes en el plan gratuito.

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Railpack Docs](https://railpack.com)
- [Railway Discord](https://discord.gg/railway)

---

**¿Necesitas ayuda?** Revisa los logs en Railway o contacta en el Discord de Railway.
