# 🚀 Despliegue Rápido en Railway

## Problema Actual
Railway no puede desplegar `docker-compose` directamente. Necesitas **3 servicios separados**.

## ✅ Solución: Configuración Multi-Servicio

### Paso 1: Crear Proyecto Base
1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio

### Paso 2: Añadir PostgreSQL
1. En el proyecto, click "+ New"
2. "Database" → "Add PostgreSQL"
3. ✅ Listo (Railway lo configura automáticamente)

### Paso 3: Desplegar API
1. "+ New" → "GitHub Repo" (mismo repo)
2. Nombra el servicio: `gts-api`
3. **Settings** → **Root Directory**: `/api`
4. **Variables** (añade estas):

```bash
NODE_ENV=production
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
PORT=${{PORT}}
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

5. **Settings** → **Networking** → "Generate Domain"
6. Copia la URL generada (la necesitarás para el frontend)

### Paso 4: Desplegar Frontend
1. "+ New" → "GitHub Repo" (mismo repo)
2. Nombra el servicio: `gts-frontend`
3. **Settings** → **Root Directory**: `/frontend`
4. **Settings** → **Builder**: Selecciona "Dockerfile"
5. **Variables** (añade esta):

```bash
VITE_API_URL=https://${{API.RAILWAY_PUBLIC_DOMAIN}}
```

O si prefieres usar la URL directa del API:
```bash
VITE_API_URL=https://gts-api-production.up.railway.app
```

6. **Settings** → **Networking** → "Generate Domain"

### Paso 5: Inicializar Base de Datos

**Opción A: Usando Railway CLI**
```bash
# Instalar CLI
npm install -g @railway/cli

# Login y conectar
railway login
railway link

# Conectar a PostgreSQL y ejecutar script
railway run psql -f database/init.sql
```

**Opción B: Manual**
1. En Railway, ve al servicio PostgreSQL
2. Click en "Data" → "Query"
3. Copia y pega el contenido de `database/init.sql`
4. Ejecuta

**Opción C: Desde tu máquina**
```bash
# Copia las credenciales del servicio PostgreSQL en Railway
psql -h <PGHOST> -U <PGUSER> -d <PGDATABASE> -f database/init.sql
```

### Paso 6: Verificar
1. Abre la URL del frontend (ejemplo: `https://gts-frontend-production.up.railway.app`)
2. Verifica que conecta con el API
3. Revisa los logs en Railway si hay errores

## 🎯 Estructura Final

```
Railway Project: GTS Mesa Servicios
│
├── 📦 Postgres (Plugin)
│   └── Auto-configurado por Railway
│
├── 🔧 gts-api (Servicio)
│   ├── Root: /api
│   ├── Builder: Nixpacks (Node.js)
│   └── URL: https://gts-api-production.up.railway.app
│
└── 🎨 gts-frontend (Servicio)
    ├── Root: /frontend
    ├── Builder: Dockerfile
    └── URL: https://gts-frontend-production.up.railway.app
```

## 🔗 Referencias de Variables

Railway permite referenciar variables entre servicios:

- `${{Postgres.PGHOST}}` → Host de PostgreSQL
- `${{API.RAILWAY_PUBLIC_DOMAIN}}` → Dominio público del API
- `${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` → Dominio público del Frontend
- `${{PORT}}` → Puerto asignado por Railway

## ⚠️ Errores Comunes

### "Railpack could not determine how to build"
**Causa**: No configuraste el Root Directory
**Solución**: Settings → Root Directory → `/api` o `/frontend`

### "Cannot connect to database"
**Causa**: Variables de entorno incorrectas
**Solución**: Verifica que las referencias `${{Postgres.*}}` estén bien escritas

### "CORS error" en el frontend
**Causa**: FRONTEND_URL no configurada en el API
**Solución**: Añade `FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` en las variables del API

### "Build failed" en frontend
**Causa**: Builder incorrecto
**Solución**: Settings → Builder → "Dockerfile"

## 💡 Tips

1. **Logs en tiempo real**: Click en cualquier servicio → "View Logs"
2. **Redeploy**: Settings → "Redeploy" si cambias algo
3. **Variables**: Puedes usar referencias entre servicios con `${{ServiceName.VARIABLE}}`
4. **Dominios custom**: Settings → Domains → "Custom Domain"

## 📊 Costos Estimados

- **Plan Hobby**: $5 gratis/mes
- **Este proyecto**: ~$2-4/mes
- **Si excedes**: $0.000231/GB-hour + $0.000463/vCPU-hour

## 🆘 ¿Necesitas Ayuda?

1. Revisa los logs en Railway
2. [Railway Docs](https://docs.railway.app)
3. [Railway Discord](https://discord.gg/railway)
4. Verifica que los 3 servicios estén "Active" (verde)

---

**¡Listo!** Tu dashboard estará disponible en la URL del frontend 🎉
