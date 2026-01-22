-- Script para agregar columna run_id a tablas existentes
-- Ejecutar este script en la base de datos de producción

-- Agregar run_id a tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS run_id VARCHAR(255);

-- Agregar run_id a emergencies
ALTER TABLE emergencies ADD COLUMN IF NOT EXISTS run_id VARCHAR(255);

-- Agregar run_id a transfers
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS run_id VARCHAR(255);

-- Agregar run_id a documentation_searches
ALTER TABLE documentation_searches ADD COLUMN IF NOT EXISTS run_id VARCHAR(255);

-- Agregar run_id a calls
ALTER TABLE calls ADD COLUMN IF NOT EXISTS run_id VARCHAR(255);

-- Verificar que se agregaron correctamente
SELECT 'tickets' as tabla, COUNT(*) as registros FROM tickets
UNION ALL
SELECT 'emergencies', COUNT(*) FROM emergencies
UNION ALL
SELECT 'transfers', COUNT(*) FROM transfers
UNION ALL
SELECT 'documentation_searches', COUNT(*) FROM documentation_searches
UNION ALL
SELECT 'calls', COUNT(*) FROM calls;
