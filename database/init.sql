-- Mesa de Servicios GTS - Base de Datos
-- Inicialización y schemas

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de tickets (incidencias y consultas)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_ticket VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('INCIDENCIA_TECNICA', 'CONSULTA_ESPECIALIZADA', 'RECLAMACION')),
    descripcion TEXT NOT NULL,
    usuario_afectado VARCHAR(255),
    sistema VARCHAR(100),
    prioridad VARCHAR(20) CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    estado VARCHAR(30) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO', 'ESCALADO')),
    
    -- Información de contacto (JSON)
    contacto JSONB NOT NULL,
    
    -- Metadatos
    notas TEXT,
    tiempo_respuesta_estimado INTEGER, -- en minutos
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    
    -- Índices para búsqueda
    CONSTRAINT valid_contacto CHECK (
        contacto ? 'nombre' AND 
        (contacto ? 'email' OR contacto ? 'telefono')
    )
);

-- Tabla de emergencias
CREATE TABLE IF NOT EXISTS emergencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_emergencia VARCHAR(50) UNIQUE NOT NULL,
    tipo_incidente VARCHAR(50) NOT NULL CHECK (tipo_incidente IN ('FUGA', 'DAÑO_INFRAESTRUCTURA', 'OBRAS_NO_AUTORIZADAS', 'ANOMALIA_CRITICA')),
    
    -- Ubicación
    ubicacion_completa TEXT NOT NULL,
    coordenadas JSONB, -- {lat: number, lng: number}
    municipio VARCHAR(255),
    provincia VARCHAR(100),
    
    -- Información del incidente
    descripcion_situacion TEXT NOT NULL,
    nivel_riesgo VARCHAR(20) NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    
    -- Contacto del llamante
    contacto_llamante JSONB NOT NULL,
    
    -- Estado y seguimiento
    estado VARCHAR(30) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'EN_ATENCION', 'CONTROLADA', 'RESUELTA', 'FALSA_ALARMA')),
    equipo_asignado VARCHAR(255),
    tiempo_estimado_llegada INTEGER, -- en minutos
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    atendida_at TIMESTAMP,
    resuelta_at TIMESTAMP,
    
    CONSTRAINT valid_contacto_llamante CHECK (
        contacto_llamante ? 'nombre' AND 
        contacto_llamante ? 'telefono'
    )
);

-- Tabla de transferencias a especialistas
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_destino VARCHAR(100) NOT NULL,
    resumen_consulta TEXT NOT NULL,
    
    -- Datos del usuario original
    datos_usuario JSONB NOT NULL,
    
    -- Estado de la transferencia
    estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CONECTANDO', 'TRANSFERIDO', 'RECHAZADO', 'NO_DISPONIBLE')),
    especialista_asignado VARCHAR(255),
    
    -- Relación con ticket si existe
    ticket_id UUID REFERENCES tickets(id),
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    transferido_at TIMESTAMP
);

-- Tabla de búsquedas en documentación
CREATE TABLE IF NOT EXISTS documentation_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    tipo_proceso VARCHAR(100),
    
    -- Resultados (almacenados como referencia)
    resultados_count INTEGER DEFAULT 0,
    documentos_encontrados JSONB,
    
    -- Contexto de la búsqueda
    usuario_solicitante VARCHAR(255),
    contexto TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de estado de sistemas
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sistema VARCHAR(100) NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('OPERATIVO', 'DEGRADADO', 'MANTENIMIENTO', 'CAIDO')),
    mensaje TEXT,
    
    -- Mantenimiento programado
    mantenimiento_programado BOOLEAN DEFAULT FALSE,
    inicio_mantenimiento TIMESTAMP,
    fin_mantenimiento TIMESTAMP,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de llamadas (registro general)
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información del llamante
    nombre_llamante VARCHAR(255),
    empresa VARCHAR(255),
    telefono VARCHAR(50),
    
    -- Clasificación de la llamada
    tipo_consulta VARCHAR(50) CHECK (tipo_consulta IN ('EMERGENCIA', 'INCIDENCIA', 'CONSULTA_OPERATIVA', 'CONSULTA_ADMINISTRATIVA')),
    categoria VARCHAR(100),
    
    -- Duración y estado
    duracion_segundos INTEGER,
    estado VARCHAR(30) CHECK (estado IN ('EN_CURSO', 'FINALIZADA', 'TRANSFERIDA', 'CORTADA')),
    
    -- Relaciones
    ticket_id UUID REFERENCES tickets(id),
    emergency_id UUID REFERENCES emergencies(id),
    transfer_id UUID REFERENCES transfers(id),
    
    -- Notas de la llamada
    notas TEXT,
    resolucion TEXT,
    
    -- Auditoría
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_prioridad ON tickets(prioridad);
CREATE INDEX idx_tickets_tipo ON tickets(tipo);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_numero ON tickets(numero_ticket);

CREATE INDEX idx_emergencies_estado ON emergencies(estado);
CREATE INDEX idx_emergencies_nivel_riesgo ON emergencies(nivel_riesgo);
CREATE INDEX idx_emergencies_tipo ON emergencies(tipo_incidente);
CREATE INDEX idx_emergencies_created_at ON emergencies(created_at DESC);

CREATE INDEX idx_transfers_estado ON transfers(estado);
CREATE INDEX idx_transfers_area ON transfers(area_destino);
CREATE INDEX idx_transfers_created_at ON transfers(created_at DESC);

CREATE INDEX idx_searches_created_at ON documentation_searches(created_at DESC);
CREATE INDEX idx_searches_tipo_proceso ON documentation_searches(tipo_proceso);

CREATE INDEX idx_calls_estado ON calls(estado);
CREATE INDEX idx_calls_tipo ON calls(tipo_consulta);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);

CREATE INDEX idx_system_status_sistema ON system_status(sistema);
CREATE INDEX idx_system_status_estado ON system_status(estado);

-- Función para generar número de ticket automático
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_ticket := 'GTS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('ticket_sequence')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de emergencia automático
CREATE OR REPLACE FUNCTION generate_emergency_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.codigo_emergencia := 'EMG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('emergency_sequence')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Secuencias para numeración
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS emergency_sequence START 1;

-- Triggers para auto-generar números
CREATE TRIGGER trg_generate_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    WHEN (NEW.numero_ticket IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

CREATE TRIGGER trg_generate_emergency_code
    BEFORE INSERT ON emergencies
    FOR EACH ROW
    WHEN (NEW.codigo_emergencia IS NULL)
    EXECUTE FUNCTION generate_emergency_code();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_emergencies_updated_at
    BEFORE UPDATE ON emergencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_status_updated_at
    BEFORE UPDATE ON system_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar estados de sistemas por defecto
INSERT INTO system_status (sistema, estado, mensaje) VALUES
    ('SL-ATR', 'OPERATIVO', 'Sistema funcionando correctamente'),
    ('EnergyData', 'OPERATIVO', 'Sistema funcionando correctamente'),
    ('Portal del Transportista', 'OPERATIVO', 'Sistema funcionando correctamente'),
    ('Centro Principal de Control', 'OPERATIVO', 'Sistema funcionando correctamente'),
    ('Telemedida', 'OPERATIVO', 'Sistema funcionando correctamente')
ON CONFLICT DO NOTHING;

-- Vista para estadísticas rápidas
CREATE OR REPLACE VIEW stats_summary AS
SELECT
    (SELECT COUNT(*) FROM tickets WHERE estado IN ('ABIERTO', 'EN_PROCESO')) as tickets_abiertos,
    (SELECT COUNT(*) FROM emergencies WHERE estado IN ('ACTIVA', 'EN_ATENCION')) as emergencias_activas,
    (SELECT COUNT(*) FROM calls WHERE estado = 'EN_CURSO') as llamadas_en_curso,
    (SELECT COUNT(*) FROM transfers WHERE estado IN ('PENDIENTE', 'CONECTANDO')) as transferencias_pendientes,
    (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '24 hours') as tickets_hoy,
    (SELECT COUNT(*) FROM emergencies WHERE created_at >= NOW() - INTERVAL '24 hours') as emergencias_hoy;

-- Comentarios en tablas
COMMENT ON TABLE tickets IS 'Registro de incidencias técnicas y consultas especializadas';
COMMENT ON TABLE emergencies IS 'Protocolos de emergencia activados por situaciones de riesgo';
COMMENT ON TABLE transfers IS 'Transferencias de llamadas a especialistas de área';
COMMENT ON TABLE documentation_searches IS 'Búsquedas realizadas en la documentación GTS';
COMMENT ON TABLE system_status IS 'Estado actual de los sistemas del GTS';
COMMENT ON TABLE calls IS 'Registro general de todas las llamadas recibidas';

-- Fin del script de inicialización
