# 🚀 Despliegue Rápido en Railway (SQLite - Simplificado)

## 🎉 Ahora es MÁS FÁCIL - Solo 2 Servicios

Con SQLite, **NO necesitas** base de datos separada. Solo:
- ✅ API (con base de datos incluida)
- ✅ Frontend

## 📋 Pasos Rápidos

### Paso 1: Crear Proyecto Base
1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio

### Paso 2: ~~Añadir PostgreSQL~~
❌ **YA NO ES NECESARIO** - SQLite está incluido en el API

### Paso 3: Desplegar API
1. El proyecto se creará automáticamente desde tu repo
2. **Settings** → **Root Directory**: `/api`
3. **Variables** (solo estas 3):

```bash
NODE_ENV=production
PORT=${{PORT}}
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

4. **Settings** → **Networking** → "Generate Domain"
5. ✅ La base de datos SQLite se crea automáticamente en el primer arranque

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

### Paso 5: ~~Inicializar Base de Datos~~
✅ **YA NO ES NECESARIO** - Se inicializa automáticamente

El API automáticamente:
1. Crea el archivo `gts.db`
2. Ejecuta `init-sqlite.sql`
3. Está listo para usar

### Paso 6: Verificar
1. Abre la URL del frontend (ejemplo: `https://gts-frontend-production.up.railway.app`)
2. Verifica que conecta con el API
3. Revisa los logs en Railway si hay errores

## 🎯 Estructura Final (Simplificada)

```
Railway Project: GTS Mesa Servicios
│
├── 🔧 gts-api (Servicio)
│   ├── Root: /api
│   ├── Builder: Nixpacks (Node.js)
│   ├── SQLite: /app/data/gts.db (persistente)
│   └── URL: https://gts-api-production.up.railway.app
│
└── 🎨 gts-frontend (Servicio)
    ├── Root: /frontend
    ├── Builder: Dockerfile
    └── URL: https://gts-frontend-production.up.railway.app
```

**Volumen persistente**: Railway mantiene `/app/data` entre deployments

## 🔗 Referencias de Variables

Railway permite referenciar variables entre servicios:

- `${{API.RAILWAY_PUBLIC_DOMAIN}}` → Dominio público del API
- `${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` → Dominio público del Frontend
- `${{PORT}}` → Puerto asignado por Railway

**Ya NO necesitas**: Variables de PostgreSQL (DB_HOST, DB_PORT, etc.)

## ⚠️ Errores Comunes

### "Railpack could not determine how to build"
**Causa**: No configuraste el Root Directory
**Solución**: Settings → Root Directory → `/api` o `/frontend`

### "Cannot connect to database"
**Causa**: Permisos del volumen o path incorrecto
**Solución**: Railway debería crear `/app/data` automáticamente. Revisa los logs del API

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
