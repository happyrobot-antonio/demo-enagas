# 🔄 Migración a SQLite

El proyecto ha sido migrado de PostgreSQL a SQLite para simplificar el despliegue en Railway.

## ✅ Ventajas de SQLite

1. **Sin servicio separado de BD**: La base de datos es un archivo
2. **Deploy más simple**: Solo 2 servicios en Railway (API + Frontend)
3. **Menor costo**: No necesitas el plugin de PostgreSQL
4. **Desarrollo local más fácil**: Sin Docker para desarrollo
5. **Portable**: Puedes copiar el archivo .db

## 📦 Cambios Realizados

### Archivos Modificados
- ✅ `api/config/database.js` - Ahora usa sqlite3
- ✅ `api/package.json` - Dependencia cambiada de `pg` a `sqlite3`
- ✅ `api/server.js` - Auto-inicialización de la BD
- ✅ `database/init-sqlite.sql` - Script SQL adaptado para SQLite

### Archivos Nuevos
- ✅ `docker-compose-sqlite.yml` - Docker Compose simplificado
- ✅ `api/.gitignore` - Ignora archivos .db

### Diferencias SQLite vs PostgreSQL

| Feature | PostgreSQL | SQLite |
|---------|-----------|--------|
| UUID | `uuid_generate_v4()` | `lower(hex(randomblob(16)))` |
| JSON | `JSONB` | `TEXT` |
| Timestamps | `NOW()` | `datetime('now')` |
| Auto-increment | `SERIAL` | `INTEGER PRIMARY KEY AUTOINCREMENT` |

## 🚀 Despliegue en Railway (Simplificado)

### Ya NO necesitas:
- ❌ Plugin de PostgreSQL
- ❌ Variables DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

### Solo necesitas:

#### 1️⃣ Servicio API
- Root Directory: `/api`
- Builder: Nixpacks o Dockerfile
- Variables de entorno:
```bash
NODE_ENV=production
PORT=${{PORT}}
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

#### 2️⃣ Servicio Frontend
- Root Directory: `/frontend`
- Builder: Dockerfile
- Variables de entorno:
```bash
VITE_API_URL=https://${{API.RAILWAY_PUBLIC_DOMAIN}}
```

### 🎯 Persistencia de Datos

Railway proporciona **volúmenes persistentes** automáticamente. La base de datos se guarda en:
- Path: `/app/data/gts.db`
- Los datos persisten entre deployments

### 🔄 Inicialización Automática

El servidor **automáticamente**:
1. Crea el directorio `/app/data` si no existe
2. Crea la base de datos `gts.db` si no existe
3. Ejecuta `init-sqlite.sql` para crear tablas
4. Inicia el servidor

**No necesitas ejecutar scripts manualmente** ✨

## 🏠 Desarrollo Local

### Con Docker (Recomendado)
```bash
# Usar el nuevo docker-compose simplificado
docker-compose -f docker-compose-sqlite.yml up --build
```

### Sin Docker
```bash
# En /api
npm install
npm start

# En /frontend (otra terminal)
npm install
npm run dev
```

La base de datos se creará automáticamente en `api/data/gts.db`

## 🔄 Migrar Datos Existentes (si los tienes)

Si ya tenías datos en PostgreSQL y quieres migrarlos:

1. **Exportar desde PostgreSQL**:
```bash
# Conectar a tu PostgreSQL
psql -h <host> -U <user> -d <database>

# Exportar datos
\copy tickets TO 'tickets.csv' CSV HEADER;
\copy emergencies TO 'emergencies.csv' CSV HEADER;
# ... (repite para otras tablas)
```

2. **Importar a SQLite**:
```bash
sqlite3 api/data/gts.db

# Importar datos
.mode csv
.import tickets.csv tickets
.import emergencies.csv emergencies
```

## 🧪 Testing

El script de demo sigue funcionando igual:

```bash
chmod +x test-demo.sh
./test-demo.sh
```

## 📊 Limitaciones de SQLite

Comparado con PostgreSQL, SQLite tiene algunas limitaciones:

| Feature | PostgreSQL | SQLite |
|---------|-----------|--------|
| Conexiones simultáneas | Miles | ~10-20 (escritura) |
| Tamaño máximo BD | Ilimitado | ~281 TB (teórico) |
| Full-text search | Avanzado | Básico (FTS5) |
| JSON queries | JSONB operators | JSON functions |
| Replicación | Sí | No nativo |

**Para este dashboard**: SQLite es perfecto ✅

## ⚠️ Notas Importantes

1. **Backups**: En Railway, configura backups del volumen `/app/data`
2. **Escritura concurrente**: SQLite maneja bien lecturas concurrentes, pero escrituras son secuenciales
3. **JSON**: Los datos JSON se guardan como TEXT, el parsing se hace en la aplicación
4. **UUIDs**: Usamos hex strings en lugar de UUIDs nativos

## 🔙 Rollback a PostgreSQL

Si necesitas volver a PostgreSQL, los archivos antiguos están en el historial de git:

```bash
git show HEAD~1:api/config/database.js > api/config/database.js
git show HEAD~1:api/package.json > api/package.json
git show HEAD~1:database/init.sql > database/init.sql
```

Luego reinstala dependencias:
```bash
cd api
npm install pg@^8.11.3
npm uninstall sqlite3
```

---

**¿Listo para desplegar?** Sigue la guía en `QUICK_RAILWAY_SETUP.md` (ahora es aún más simple) 🚀
