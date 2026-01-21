-- Mesa de Servicios GTS - Base de Datos SQLite
-- Inicialización y schemas

-- Habilitar foreign keys
PRAGMA foreign_keys = ON;

-- Tabla de tickets (incidencias y consultas)
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    numero_ticket TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('INCIDENCIA_TECNICA', 'CONSULTA_ESPECIALIZADA', 'RECLAMACION')),
    descripcion TEXT NOT NULL,
    usuario_afectado TEXT,
    sistema TEXT,
    prioridad TEXT CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    estado TEXT DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO', 'ESCALADO')),
    
    -- Información de contacto (JSON string)
    contacto TEXT NOT NULL,
    
    -- Metadatos
    notas TEXT,
    tiempo_respuesta_estimado INTEGER, -- en minutos
    
    -- Auditoría
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- Tabla de emergencias
CREATE TABLE IF NOT EXISTS emergencies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    codigo_emergencia TEXT UNIQUE NOT NULL,
    tipo_incidente TEXT NOT NULL CHECK (tipo_incidente IN ('FUGA', 'DAÑO_INFRAESTRUCTURA', 'OBRAS_NO_AUTORIZADAS', 'ANOMALIA_CRITICA')),
    
    -- Ubicación
    ubicacion_completa TEXT NOT NULL,
    coordenadas TEXT, -- JSON: {lat: number, lng: number}
    municipio TEXT,
    provincia TEXT,
    
    -- Información del incidente
    descripcion_situacion TEXT NOT NULL,
    nivel_riesgo TEXT NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    
    -- Contacto del llamante
    contacto_llamante TEXT NOT NULL, -- JSON
    
    -- Información de respuesta
    equipo_asignado TEXT,
    tiempo_estimado_llegada INTEGER, -- en minutos
    
    -- Estado
    estado TEXT DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'EN_ATENCION', 'CONTROLADA', 'RESUELTA', 'FALSA_ALARMA')),
    
    -- Auditoría
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- Tabla de transferencias a especialistas
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ticket_id TEXT,
    especialista_destino TEXT NOT NULL,
    departamento TEXT NOT NULL CHECK (departamento IN ('TECNICO_GAS', 'COMERCIAL', 'JURIDICO', 'OPERACIONES', 'SEGURIDAD')),
    motivo_transferencia TEXT NOT NULL,
    contexto_adicional TEXT,
    
    -- Estado
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'COMPLETADA')),
    
    -- Auditoría
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- Tabla de búsquedas en documentación
CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('NORMATIVA', 'PROCEDIMIENTOS', 'TECNICA', 'CLIENTES', 'GENERAL')),
    resultados_encontrados INTEGER DEFAULT 0,
    tiempo_respuesta_ms INTEGER,
    
    -- Auditoría
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de llamadas recibidas
CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nombre_llamante TEXT,
    telefono TEXT,
    empresa TEXT,
    
    -- Tipo de consulta
    tipo_consulta TEXT CHECK (tipo_consulta IN ('EMERGENCIA', 'INCIDENCIA', 'CONSULTA_OPERATIVA', 'CONSULTA_ADMINISTRATIVA')),
    categoria TEXT,
    
    -- Información de la llamada
    duracion_segundos INTEGER,
    notas TEXT,
    resolucion TEXT,
    
    -- Estado
    estado TEXT DEFAULT 'EN_CURSO' CHECK (estado IN ('EN_CURSO', 'FINALIZADA', 'TRANSFERIDA', 'CORTADA')),
    
    -- Auditoría
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT
);

-- Tabla de estados de sistemas
CREATE TABLE IF NOT EXISTS system_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sistema TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('OPERATIVO', 'DEGRADADO', 'MANTENIMIENTO', 'CAIDO')),
    mensaje TEXT,
    
    -- Auditoría
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de estadísticas agregadas (materializada)
CREATE TABLE IF NOT EXISTS stats_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Solo una fila
    tickets_abiertos INTEGER DEFAULT 0,
    emergencias_activas INTEGER DEFAULT 0,
    llamadas_en_curso INTEGER DEFAULT 0,
    transferencias_pendientes INTEGER DEFAULT 0,
    tickets_hoy INTEGER DEFAULT 0,
    emergencias_hoy INTEGER DEFAULT 0,
    
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insertar fila inicial de estadísticas
INSERT OR IGNORE INTO stats_cache (id) VALUES (1);

-- Insertar datos iniciales de sistemas
INSERT OR IGNORE INTO system_status (id, sistema, estado, mensaje) VALUES
(1, 'Red de Transporte', 'OPERATIVO', 'Todos los sistemas funcionando correctamente'),
(2, 'Plantas Regasificadoras', 'OPERATIVO', 'Operación normal'),
(3, 'Sistema SCADA', 'OPERATIVO', 'Monitorización activa'),
(4, 'Centro de Control', 'OPERATIVO', 'Personal en turno');

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON tickets(tipo);

CREATE INDEX IF NOT EXISTS idx_emergencies_estado ON emergencies(estado);
CREATE INDEX IF NOT EXISTS idx_emergencies_created ON emergencies(created_at);
CREATE INDEX IF NOT EXISTS idx_emergencies_nivel ON emergencies(nivel_riesgo);

CREATE INDEX IF NOT EXISTS idx_transfers_estado ON transfers(estado);
CREATE INDEX IF NOT EXISTS idx_transfers_ticket ON transfers(ticket_id);

CREATE INDEX IF NOT EXISTS idx_calls_estado ON calls(estado);
CREATE INDEX IF NOT EXISTS idx_calls_started ON calls(started_at);

CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at);
CREATE INDEX IF NOT EXISTS idx_searches_categoria ON searches(categoria);

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER IF NOT EXISTS update_tickets_timestamp 
AFTER UPDATE ON tickets
BEGIN
    UPDATE tickets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_emergencies_timestamp 
AFTER UPDATE ON emergencies
BEGIN
    UPDATE emergencies SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_transfers_timestamp 
AFTER UPDATE ON transfers
BEGIN
    UPDATE transfers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_system_status_timestamp 
AFTER UPDATE ON system_status
BEGIN
    UPDATE system_status SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para actualizar estadísticas cuando cambian tickets
CREATE TRIGGER IF NOT EXISTS update_stats_on_ticket_insert
AFTER INSERT ON tickets
BEGIN
    UPDATE stats_cache SET
        tickets_abiertos = (SELECT COUNT(*) FROM tickets WHERE estado IN ('ABIERTO', 'EN_PROCESO')),
        tickets_hoy = (SELECT COUNT(*) FROM tickets WHERE date(created_at) = date('now')),
        updated_at = datetime('now');
END;

CREATE TRIGGER IF NOT EXISTS update_stats_on_ticket_update
AFTER UPDATE ON tickets
BEGIN
    UPDATE stats_cache SET
        tickets_abiertos = (SELECT COUNT(*) FROM tickets WHERE estado IN ('ABIERTO', 'EN_PROCESO')),
        updated_at = datetime('now');
END;

-- Trigger para actualizar estadísticas cuando cambian emergencias
CREATE TRIGGER IF NOT EXISTS update_stats_on_emergency_insert
AFTER INSERT ON emergencies
BEGIN
    UPDATE stats_cache SET
        emergencias_activas = (SELECT COUNT(*) FROM emergencies WHERE estado IN ('ACTIVA', 'EN_ATENCION')),
        emergencias_hoy = (SELECT COUNT(*) FROM emergencies WHERE date(created_at) = date('now')),
        updated_at = datetime('now');
END;

CREATE TRIGGER IF NOT EXISTS update_stats_on_emergency_update
AFTER UPDATE ON emergencies
BEGIN
    UPDATE stats_cache SET
        emergencias_activas = (SELECT COUNT(*) FROM emergencies WHERE estado IN ('ACTIVA', 'EN_ATENCION')),
        updated_at = datetime('now');
END;

-- Trigger para actualizar estadísticas cuando cambian llamadas
CREATE TRIGGER IF NOT EXISTS update_stats_on_call_insert
AFTER INSERT ON calls
BEGIN
    UPDATE stats_cache SET
        llamadas_en_curso = (SELECT COUNT(*) FROM calls WHERE estado = 'EN_CURSO'),
        updated_at = datetime('now');
END;

CREATE TRIGGER IF NOT EXISTS update_stats_on_call_update
AFTER UPDATE ON calls
BEGIN
    UPDATE stats_cache SET
        llamadas_en_curso = (SELECT COUNT(*) FROM calls WHERE estado = 'EN_CURSO'),
        updated_at = datetime('now');
END;

-- Trigger para actualizar estadísticas cuando cambian transferencias
CREATE TRIGGER IF NOT EXISTS update_stats_on_transfer_insert
AFTER INSERT ON transfers
BEGIN
    UPDATE stats_cache SET
        transferencias_pendientes = (SELECT COUNT(*) FROM transfers WHERE estado = 'PENDIENTE'),
        updated_at = datetime('now');
END;

CREATE TRIGGER IF NOT EXISTS update_stats_on_transfer_update
AFTER UPDATE ON transfers
BEGIN
    UPDATE stats_cache SET
        transferencias_pendientes = (SELECT COUNT(*) FROM transfers WHERE estado = 'PENDIENTE'),
        updated_at = datetime('now');
END;
