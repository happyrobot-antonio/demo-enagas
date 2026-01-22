-- =====================================================
-- DATOS DE EJEMPLO - SISTEMA PRL ENAGÁS
-- =====================================================

-- Turno actual de mañana en Planta de Compresión Huelva
INSERT INTO prl_shifts (nombre, planta, fecha, hora_inicio, hora_fin, supervisor, estado)
VALUES 
  ('Mañana', 'Planta de Compresión Huelva', CURRENT_DATE, '07:00', '15:00', 'Carlos Mendoza', 'ACTIVO'),
  ('Tarde', 'Estación de Regulación Valladolid', CURRENT_DATE, '15:00', '23:00', 'Ana Martínez', 'ACTIVO');

-- Trabajadores del turno de mañana - Planta Huelva
DO $$
DECLARE
  shift_huelva UUID;
  worker1 UUID;
  worker2 UUID;
  worker3 UUID;
BEGIN
  -- Obtener ID del turno de Huelva
  SELECT id INTO shift_huelva FROM prl_shifts WHERE planta = 'Planta de Compresión Huelva' AND fecha = CURRENT_DATE LIMIT 1;
  
  -- Trabajador 1: Trabajo en altura - COMPLETADO
  INSERT INTO prl_workers (
    shift_id, nombre_completo, employee_id, empresa, categoria, telefono,
    tipo_trabajo, descripcion_tarea, ubicacion_trabajo,
    riesgos_identificados, equipos_proteccion_requeridos,
    checklist_estado, checklist_completado_at, prioridad
  ) VALUES (
    shift_huelva, 'Miguel Ángel Ruiz', 'ENG-2847', 'Enagás Transporte', 'Técnico Especialista', '+34600111222',
    'INSPECCION_ALTURA', 'Inspección visual de válvulas en Torre de Enfriamiento 3', 'Zona Norte - Torre 3',
    ARRAY['TRABAJO_ALTURA', 'CAIDA_OBJETOS'], 
    ARRAY['Arnés anticaídas', 'Casco', 'Guantes dieléctricos', 'Calzado seguridad'],
    'COMPLETADO', NOW() - INTERVAL '2 hours', 'ALTA'
  ) RETURNING id INTO worker1;
  
  -- Trabajador 2: Espacio confinado - PENDIENTE (ALERTA)
  INSERT INTO prl_workers (
    shift_id, nombre_completo, employee_id, empresa, categoria, telefono,
    tipo_trabajo, descripcion_tarea, ubicacion_trabajo,
    riesgos_identificados, equipos_proteccion_requeridos,
    checklist_estado, prioridad, proxima_llamada_programada
  ) VALUES (
    shift_huelva, 'Javier Sánchez Pérez', 'ENG-3102', 'Enagás Transporte', 'Operario Especializado', '+34600222333',
    'ESPACIO_CONFINADO', 'Mantenimiento interno Compresor C-201 - Limpieza de filtros', 'Sala Compresores - C-201',
    ARRAY['ESPACIO_CONFINADO', 'ATMOSFERA_TOXICA', 'FALTA_OXIGENO'], 
    ARRAY['Equipo respiración autónoma', 'Detector gases', 'Arnés rescate', 'Radio comunicación'],
    'PENDIENTE', 'CRITICA', NOW() + INTERVAL '5 minutes'
  ) RETURNING id INTO worker2;
  
  -- Trabajador 3: Trabajo en caliente - PENDIENTE (CRÍTICO)
  INSERT INTO prl_workers (
    shift_id, nombre_completo, employee_id, empresa, categoria, telefono,
    tipo_trabajo, descripcion_tarea, ubicacion_trabajo,
    riesgos_identificados, equipos_proteccion_requeridos,
    checklist_estado, prioridad, proxima_llamada_programada
  ) VALUES (
    shift_huelva, 'José Antonio Ferrer', 'SUB-0451', 'Montajes Industriales Sur', 'Soldador Certificado', '+34600333444',
    'TRABAJO_CALIENTE', 'Soldadura reparación brida Línea LP-04 tramo km 12.4', 'Zona Exterior - Tramo LP-04',
    ARRAY['TRABAJO_CALIENTE', 'INCENDIO', 'EXPLOSION', 'QUEMADURAS'], 
    ARRAY['Ropa ignífuga', 'Pantalla soldadura', 'Extintor CO2', 'Medidor explosividad', 'Permiso trabajo caliente'],
    'PENDIENTE', 'CRITICA', NOW() + INTERVAL '3 minutes'
  ) RETURNING id INTO worker3;
  
  -- Trabajador 4: Excavación - COMPLETADO
  INSERT INTO prl_workers (
    shift_id, nombre_completo, employee_id, empresa, categoria, telefono,
    tipo_trabajo, descripcion_tarea, ubicacion_trabajo,
    riesgos_identificados, equipos_proteccion_requeridos,
    checklist_estado, checklist_completado_at, prioridad
  ) VALUES (
    shift_huelva, 'David Romero Gil', 'SUB-0892', 'Excavaciones Andalucía', 'Operador Maquinaria', '+34600444555',
    'EXCAVACION', 'Excavación controlada para inspección de recubrimiento gasoducto', 'Perímetro Exterior Este',
    ARRAY['EXCAVACION', 'ROTURA_TUBERIA', 'SEPULTAMIENTO'], 
    ARRAY['Detector gases portátil', 'Casco', 'Chaleco reflectante', 'Planos actualizados'],
    'COMPLETADO', NOW() - INTERVAL '1 hour', 'ALTA'
  );
  
  -- Trabajador 5: Inspección rutinaria - PENDIENTE
  INSERT INTO prl_workers (
    shift_id, nombre_completo, employee_id, empresa, categoria, telefono,
    tipo_trabajo, descripcion_tarea, ubicacion_trabajo,
    riesgos_identificados, equipos_proteccion_requeridos,
    checklist_estado, prioridad, proxima_llamada_programada
  ) VALUES (
    shift_huelva, 'Carmen López Torres', 'ENG-2156', 'Enagás Transporte', 'Técnico Instrumentación', '+34600555666',
    'INSPECCION_INSTRUMENTACION', 'Verificación calibración transmisores de presión línea HP-12', 'Sala Control - Panel B',
    ARRAY['RIESGO_ELECTRICO', 'ALTA_PRESION'], 
    ARRAY['Guantes dieléctricos', 'Gafas protección', 'Detector gases'],
    'PENDIENTE', 'MEDIA', NOW() + INTERVAL '15 minutes'
  );
  
  -- Trabajador 6: Mantenimiento mecánico - NO_CONTACTADO (problema)
  INSERT INTO prl_workers (
    shift_id, nombre_completo, employee_id, empresa, categoria, telefono,
    tipo_trabajo, descripcion_tarea, ubicacion_trabajo,
    riesgos_identificados, equipos_proteccion_requeridos,
    checklist_estado, prioridad, llamadas_intentadas, ultima_llamada_at
  ) VALUES (
    shift_huelva, 'Roberto Sanz Muñoz', 'SUB-1203', 'Mantenimiento Industrial Huelva', 'Mecánico', '+34600666777',
    'MANTENIMIENTO_MECANICO', 'Sustitución rodamientos ventilador aeroenfriador AE-102', 'Zona Enfriamiento - AE-102',
    ARRAY['ATRAPAMIENTO', 'PROYECCION_PARTICULAS', 'RUIDO'], 
    ARRAY['Guantes anticorte', 'Gafas protección', 'Protección auditiva'],
    'NO_CONTACTADO', 'ALTA', 3, NOW() - INTERVAL '10 minutes'
  );
  
  -- Crear checklist completado para trabajador 1
  INSERT INTO prl_safety_checklists (
    worker_id, completado_at, duracion_segundos, respuestas, estado, metodo, verificado_por
  ) VALUES (
    worker1,
    NOW() - INTERVAL '2 hours',
    145,
    jsonb_build_object(
      'preguntas', jsonb_build_array(
        jsonb_build_object('pregunta', '¿Ha revisado el equipo anticaídas y está en buen estado?', 'respuesta', 'Sí', 'conforme', true),
        jsonb_build_object('pregunta', '¿La zona de trabajo está señalizada y acordonada?', 'respuesta', 'Sí', 'conforme', true),
        jsonb_build_object('pregunta', '¿Dispone de radio de comunicación operativo?', 'respuesta', 'Sí', 'conforme', true),
        jsonb_build_object('pregunta', '¿Ha comprobado las condiciones meteorológicas?', 'respuesta', 'Sí', 'conforme', true),
        jsonb_build_object('pregunta', '¿Cuenta con vigilante de seguridad designado?', 'respuesta', 'Sí - Pedro García', 'conforme', true)
      )
    ),
    'COMPLETO',
    'LLAMADA_TELEFONICA',
    'Sistema Automatizado PRL'
  );
  
  -- Crear llamada completada para trabajador 1
  INSERT INTO prl_safety_calls (
    worker_id, telefono_destino, estado, programada_para, iniciada_at, finalizada_at,
    duracion_segundos, contacto_exitoso, checklist_completado, call_id
  ) VALUES (
    worker1, '+34600111222', 'COMPLETADA', 
    NOW() - INTERVAL '2 hours 5 minutes', NOW() - INTERVAL '2 hours 2 minutes', NOW() - INTERVAL '2 hours',
    145, TRUE, TRUE, 'CALL_' || gen_random_uuid()
  );
  
  
  -- Crear incidente para trabajador 6 (no contactado)
  INSERT INTO prl_incidents (
    worker_id, shift_id, tipo, severidad, descripcion, ubicacion,
    accion_inmediata, trabajo_detenido, estado, responsable
  ) VALUES (
    (SELECT id FROM prl_workers WHERE employee_id = 'SUB-1203'),
    shift_huelva,
    'NO_CONTACTADO',
    'MEDIA',
    'Trabajador Roberto Sanz no responde a 3 intentos de llamada para verificación de checklist de seguridad previo a mantenimiento mecánico. Última llamada hace 10 minutos.',
    'Zona Enfriamiento - AE-102',
    'Supervisor enviado a ubicación de trabajo. Trabajo en espera hasta contacto',
    FALSE,
    'ABIERTO',
    'Carlos Mendoza'
  );
  
END $$;
