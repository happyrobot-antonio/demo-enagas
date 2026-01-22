# 🔧 Solución de Problemas PRL - "No hay turnos activos"

## 🎯 Problema Identificado

El sistema PRL muestra "No hay turnos activos en este momento" aunque los datos existen en la base de datos.

### ✅ Datos Verificados en PostgreSQL

```sql
-- Turnos activos HOY (2026-01-22):
- Turno Mañana - Planta de Compresión Huelva
- Turno Tarde - Estación de Regulación Valladolid

-- Trabajadores: 6 total
- 2 completados
- 2 pendientes  
- 1 en curso
- 1 no contactado
```

## 🔍 Causa Raíz

**Railway no había desplegado las rutas PRL en la API.**

El archivo `api/routes/prl.js` existe localmente pero no estaba siendo servido en producción porque Railway no había redesplegado la API con los cambios más recientes.

## 🚀 Solución Aplicada

### Paso 1: Cambios en `api/server.js`
- ✅ Versión actualizada a **1.2.0**
- ✅ Log explícito: `✅ Rutas PRL registradas en /api/prl`
- ✅ Mensaje de inicio: `🛡️ Sistema PRL activo en /api/prl`
- ✅ Info detallada de endpoints PRL en ruta raíz

### Paso 2: Commit y Push
```bash
git commit -m "fix: FORZAR redespliegue completo API con rutas PRL"
git push origin main
```

### Paso 3: Esperando Redespliegue de Railway
⏳ **Railway está redesplegando la API ahora** (~3-5 minutos)

## 🧪 Cómo Verificar que Funciona

### Opción 1: Usar el Script de Prueba

Cuando Railway termine de desplegar, ejecuta:

```bash
# Probar API de producción (reemplaza con tu URL real)
./test-prl-api.sh https://api-production-xxx.railway.app
```

Deberías ver:
```
✅ Ruta raíz responde
✅ Turnos activos: 2
✅ Trabajadores encontrados: 6
```

### Opción 2: Verificar Manualmente

1. **Abrir la ruta raíz de la API:**
   ```
   https://api-production-xxx.railway.app/
   ```
   
   Deberías ver en la respuesta JSON:
   ```json
   {
     "version": "1.2.0",
     "prl": {
       "description": "Sistema PRL - Prevención de Riesgos Laborales",
       "available": true,
       "routes": {
         "shifts": "/api/prl/shifts/active",
         "workers": "/api/prl/workers",
         ...
       }
     }
   }
   ```

2. **Probar endpoint de turnos:**
   ```
   https://api-production-xxx.railway.app/api/prl/shifts/active
   ```
   
   Deberías ver:
   ```json
   {
     "success": true,
     "shifts": [
       {
         "nombre": "Mañana",
         "planta": "Planta de Compresión Huelva",
         "fecha": "2026-01-22",
         ...
       },
       ...
     ]
   }
   ```

3. **Recargar el dashboard PRL:**
   ```
   https://frontend-production-f6d9.up.railway.app/prl
   ```
   
   Deberías ver:
   - Header con info del turno
   - Estadísticas (2 completados, 2 pendientes, etc.)
   - Lista de 6 trabajadores

## 🕐 Timeline

| Tiempo | Estado |
|--------|--------|
| Ahora | ⏳ Railway desplegando API |
| +3 min | ✅ API disponible con rutas PRL |
| +4 min | ✅ Frontend puede obtener datos |
| +5 min | ✅ Dashboard PRL funcionando |

## 🎯 Qué Esperar Ver

### Dashboard PRL Funcionando:

```
================================================
🏭 Planta de Compresión Huelva
🕐 Turno: Mañana (07:00 - 15:00)  
👤 Supervisor: Carlos Mendoza
================================================

📊 ESTADÍSTICAS
✅ 2 Completados  |  ⏳ 2 Pendientes  
📞 1 En Curso     |  ⚠️ 1 Alerta

================================================
👷 TRABAJADORES DEL TURNO

🟢 Miguel Ángel Ruiz
   Inspección altura - Torre 3
   [Ver Detalle]

🔴 Laura Sánchez (CRÍTICO)
   Espacio confinado - Compresor C-201
   [LLAMAR]

🟡 José Antonio Ferrer
   Soldadura - Línea LP-04
   [Llamando...]

... (3 más)
================================================
```

## ❗ Si Después de 5 Minutos Sigue Sin Funcionar

1. **Verificar logs de Railway:**
   - Ve al dashboard de Railway
   - Selecciona el servicio API
   - Mira los logs de despliegue
   - Busca: `🛡️ Sistema PRL activo en /api/prl`

2. **Verificar variables de entorno:**
   - Confirma que todas las variables de BD están configuradas
   - Especialmente: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

3. **Redesplegar manualmente:**
   - En Railway dashboard
   - Servicio API → "Deploy" → "Redeploy"

4. **Última opción - Script SQL:**
   ```bash
   # Recrear turnos para HOY
   docker run --rm -i postgres:15-alpine psql $DATABASE_URL < database/prl_seed.sql
   ```

## 📞 Contacto

Si nada de esto funciona, el problema podría ser:
- URL de la API mal configurada en el frontend
- Railway no detectando cambios en subcarpetas
- Problema de permisos en base de datos

---

**⏰ Última actualización:** 2026-01-22  
**🔄 Estado:** Esperando redespliegue de Railway
