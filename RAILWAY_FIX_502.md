# 🔧 Fix para Error 502 en Railway

## ✅ El código está CORRECTO

He verificado `api/server.js` y está usando la variable correcta:

```javascript
const PORT = process.env.PORT || 3000;  ✅ CORRECTO
```

## 🚨 El problema está en las VARIABLES DE RAILWAY

Si los logs muestran:
```
🚀 Servidor GTS API iniciado en puerto 5432
```

Significa que la variable `PORT` tiene el valor `5432` en Railway.

## 🔧 SOLUCIÓN - Verifica en Railway:

### 1. Ve a tu servicio API en Railway

### 2. Click en "Variables"

### 3. Busca la variable `PORT`

### 4. Debe decir EXACTAMENTE:

```
PORT=${{PORT}}
```

**NO** debe decir:
- ❌ `PORT=5432`
- ❌ `PORT=3000`
- ❌ `PORT=${{DB_PORT}}`
- ❌ Cualquier otro valor

### 5. Si está mal:

1. **BORRA** la variable PORT incorrecta
2. Click "+ New Variable"
3. Variable Name: `PORT`
4. Variable Value: `${{PORT}}` (copia exactamente con llaves)
5. Save
6. Click "Redeploy"

## ✅ Después del fix:

Los logs deberían mostrar algo como:
```
🚀 Servidor GTS API iniciado en puerto 8234
```

O cualquier número que Railway asigne (NO será 5432).

## 🎯 TODAS tus variables deben ser:

```
NODE_ENV=production
PORT=${{PORT}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

## 🔍 Cómo verificar que está bien:

Después de redeploy, ve a los logs y busca:
```
🚀 Servidor GTS API iniciado en puerto XXXX
```

Si `XXXX` es diferente de 5432, 3000, etc. → ✅ FUNCIONA
Si es 5432 → ❌ La variable PORT sigue mal

---

**El código está perfecto. El problema es 100% la configuración de variables en Railway.**
