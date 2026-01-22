-- =====================================================
-- SISTEMA PRL - PREVENCIÓN DE RIESGOS LABORALES ENAGÁS
-- =====================================================

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS prl_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL, -- 'Mañana', 'Tarde', 'Noche'
    planta VARCHAR(255) NOT NULL, -- 'Planta de Compresión Huelva', 'Estación de Regulación Valladolid', etc.
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    supervisor VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de trabajadores en turno
CREATE TABLE IF NOT EXISTS prl_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES prl_shifts(id) ON DELETE CASCADE,
    
    -- Datos del trabajador
    nombre_completo VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL, -- ID de empleado/contratista
    empresa VARCHAR(255), -- Enagás o empresa subcontratada
    categoria VARCHAR(100), -- 'Técnico', 'Operario', 'Especialista'
    telefono VARCHAR(50) NOT NULL,
    
    -- Tarea asignada
    tipo_trabajo VARCHAR(100) NOT NULL,
    descripcion_tarea TEXT NOT NULL,
    ubicacion_trabajo VARCHAR(255), -- Zona específica de la planta
    
    -- Riesgos identificados
    riesgos_identificados TEXT[], -- Array de riesgos: 'ESPACIO_CONFINADO', 'TRABAJO_ALTURA', etc.
    equipos_proteccion_requeridos TEXT[], -- EPIs requeridos
    
    -- Estado del checklist
    checklist_estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (
        checklist_estado IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'INCOMPLETO', 'NO_CONTACTADO')
    ),
    checklist_completado_at TIMESTAMP,
    
    -- Control de llamadas
    llamadas_intentadas INTEGER DEFAULT 0,
    ultima_llamada_at TIMESTAMP,
    proxima_llamada_programada TIMESTAMP,
    
    -- Prioridad (basada en riesgo de la tarea)
    prioridad VARCHAR(20) DEFAULT 'MEDIA' CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de checklists de seguridad
CREATE TABLE IF NOT EXISTS prl_safety_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES prl_workers(id) ON DELETE CASCADE,
    
    -- Datos de la verificación
    iniciado_at TIMESTAMP DEFAULT NOW(),
    completado_at TIMESTAMP,
    duracion_segundos INTEGER,
    
    -- Respuestas del checklist (JSON con preguntas y respuestas)
    respuestas JSONB NOT NULL,
    
    -- Resultado
    estado VARCHAR(30) CHECK (estado IN ('COMPLETO', 'INCOMPLETO', 'CON_OBSERVACIONES')),
    observaciones TEXT,
    incidencias_detectadas TEXT[],
    
    -- Método de verificación
    metodo VARCHAR(50) CHECK (metodo IN ('LLAMADA_TELEFONICA', 'PRESENCIAL', 'VIDEO_LLAMADA', 'AUTOMATICO')),
    
    -- Verificador
    verificado_por VARCHAR(255), -- Nombre del supervisor/sistema
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de llamadas de seguridad
CREATE TABLE IF NOT EXISTS prl_safety_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES prl_workers(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES prl_safety_checklists(id),
    
    -- Datos de la llamada
    telefono_destino VARCHAR(50) NOT NULL,
    estado VARCHAR(30) CHECK (estado IN ('PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'FALLIDA', 'NO_RESPONDE', 'CANCELADA')),
    
    -- Scheduling
    programada_para TIMESTAMP,
    iniciada_at TIMESTAMP,
    finalizada_at TIMESTAMP,
    duracion_segundos INTEGER,
    
    -- Resultado
    contacto_exitoso BOOLEAN,
    checklist_completado BOOLEAN DEFAULT FALSE,
    motivo_fallo VARCHAR(255), -- 'No responde', 'Número incorrecto', 'Rechazada', etc.
    
    -- Integración con sistema de llamadas
    call_id VARCHAR(255), -- ID externo del sistema de llamadas
    run_id VARCHAR(255), -- ID de HappyRobot
    recording_url TEXT,
    
    -- Metadata
    intentos_previos INTEGER DEFAULT 0,
    notas TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de incidentes PRL
CREATE TABLE IF NOT EXISTS prl_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES prl_workers(id),
    shift_id UUID REFERENCES prl_shifts(id),
    
    -- Tipo de incidente
    tipo VARCHAR(100) NOT NULL CHECK (tipo IN (
        'INCUMPLIMIENTO_CHECKLIST',
        'NO_CONTACTADO',
        'FALTA_EQUIPO_PROTECCION',
        'CONDICION_INSEGURA_DETECTADA',
        'TRABAJADOR_NO_APTO',
        'ACCIDENTE',
        'CUASI_ACCIDENTE'
    )),
    
    -- Detalles
    severidad VARCHAR(30) CHECK (severidad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    descripcion TEXT NOT NULL,
    ubicacion VARCHAR(255),
    
    -- Acciones tomadas
    accion_inmediata TEXT,
    trabajo_detenido BOOLEAN DEFAULT FALSE,
    autoridades_notificadas BOOLEAN DEFAULT FALSE,
    
    -- Seguimiento
    estado VARCHAR(30) CHECK (estado IN ('ABIERTO', 'EN_INVESTIGACION', 'RESUELTO', 'CERRADO')),
    responsable VARCHAR(255),
    fecha_cierre TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_prl_workers_shift ON prl_workers(shift_id);
CREATE INDEX IF NOT EXISTS idx_prl_workers_estado ON prl_workers(checklist_estado);
CREATE INDEX IF NOT EXISTS idx_prl_shifts_fecha ON prl_shifts(fecha);
CREATE INDEX IF NOT EXISTS idx_prl_calls_estado ON prl_safety_calls(estado);
CREATE INDEX IF NOT EXISTS idx_prl_calls_programada ON prl_safety_calls(programada_para);
CREATE INDEX IF NOT EXISTS idx_prl_incidents_tipo ON prl_incidents(tipo);
