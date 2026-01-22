const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ===================================
// SHIFTS - Turnos
// ===================================

// Obtener turno activo actual
router.get('/shifts/active', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM prl_shifts 
       WHERE estado = 'ACTIVO' AND fecha = CURRENT_DATE
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      shifts: result.rows
    });
  } catch (error) {
    console.error('Error al obtener turnos activos:', error);
    res.status(500).json({
      error: 'Error al obtener turnos activos',
      details: error.message
    });
  }
});

// Obtener turno por ID
router.get('/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM prl_shifts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.json({
      success: true,
      shift: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener turno:', error);
    res.status(500).json({
      error: 'Error al obtener turno',
      details: error.message
    });
  }
});

// ===================================
// WORKERS - Trabajadores
// ===================================

// Obtener todos los trabajadores de un turno
router.get('/workers', async (req, res) => {
  try {
    const { shift_id, checklist_estado } = req.query;

    let queryText = `
      SELECT w.*, s.nombre as turno_nombre, s.planta
      FROM prl_workers w
      LEFT JOIN prl_shifts s ON w.shift_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (shift_id) {
      queryText += ` AND w.shift_id = $${paramCount}`;
      params.push(shift_id);
      paramCount++;
    }

    if (checklist_estado) {
      queryText += ` AND w.checklist_estado = $${paramCount}`;
      params.push(checklist_estado);
      paramCount++;
    }

    queryText += ` ORDER BY 
      CASE w.prioridad 
        WHEN 'CRITICA' THEN 1 
        WHEN 'ALTA' THEN 2 
        WHEN 'NORMAL' THEN 3 
        ELSE 4 
      END,
      w.nombre_completo ASC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      workers: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    res.status(500).json({
      error: 'Error al obtener trabajadores',
      details: error.message
    });
  }
});

// Obtener trabajador por ID
router.get('/workers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT w.*, s.nombre as turno_nombre, s.planta, s.supervisor
       FROM prl_workers w
       LEFT JOIN prl_shifts s ON w.shift_id = s.id
       WHERE w.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Obtener historial de llamadas
    const callsResult = await query(
      `SELECT * FROM prl_safety_calls 
       WHERE worker_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    // Obtener checklists
    const checklistsResult = await query(
      `SELECT * FROM prl_safety_checklists 
       WHERE worker_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      worker: result.rows[0],
      calls: callsResult.rows,
      checklists: checklistsResult.rows
    });
  } catch (error) {
    console.error('Error al obtener trabajador:', error);
    res.status(500).json({
      error: 'Error al obtener trabajador',
      details: error.message
    });
  }
});

// Obtener estadísticas del turno
router.get('/shifts/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_trabajadores,
        COUNT(*) FILTER (WHERE checklist_estado = 'COMPLETADO') as completados,
        COUNT(*) FILTER (WHERE checklist_estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE checklist_estado = 'EN_CURSO') as en_curso,
        COUNT(*) FILTER (WHERE checklist_estado = 'NO_CONTACTADO') as no_contactados,
        COUNT(*) FILTER (WHERE prioridad = 'CRITICA') as trabajos_criticos,
        COUNT(*) FILTER (WHERE checklist_estado = 'PENDIENTE' AND prioridad IN ('ALTA', 'CRITICA')) as alertas
       FROM prl_workers
       WHERE shift_id = $1`,
      [id]
    );

    res.json({
      success: true,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// ===================================
// CALLS - Llamadas de Seguridad
// ===================================

// Iniciar llamada de verificación
router.post('/calls/initiate', async (req, res) => {
  try {
    const { worker_id } = req.body;

    if (!worker_id) {
      return res.status(400).json({ error: 'worker_id es requerido' });
    }

    // Obtener datos del trabajador
    const workerResult = await query(
      'SELECT * FROM prl_workers WHERE id = $1',
      [worker_id]
    );

    if (workerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const worker = workerResult.rows[0];

    // Crear registro de llamada
    const callResult = await query(
      `INSERT INTO prl_safety_calls (
        worker_id, telefono_destino, estado, programada_para, iniciada_at, contacto_exitoso
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [worker_id, worker.telefono, 'EN_CURSO', NOW(), NOW(), true]
    );

    // Actualizar estado del trabajador
    await query(
      `UPDATE prl_workers 
       SET checklist_estado = 'EN_CURSO', 
           llamadas_intentadas = llamadas_intentadas + 1,
           ultima_llamada_at = NOW()
       WHERE id = $1`,
      [worker_id]
    );

    const call = callResult.rows[0];

    // Emitir evento en tiempo real
    req.io.emit('prl:call:initiated', {
      call,
      worker
    });

    res.status(201).json({
      success: true,
      message: 'Llamada iniciada',
      call,
      webhook_url: process.env.HAPPYROBOT_WEBHOOK_URL || 'https://api.happyrobot.ai/webhook/prl-call'
    });

  } catch (error) {
    console.error('Error al iniciar llamada:', error);
    res.status(500).json({
      error: 'Error al iniciar llamada',
      details: error.message
    });
  }
});

// Actualizar estado de llamada (webhook callback)
router.post('/calls/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      contacto_exitoso,
      checklist_completado,
      duracion_segundos,
      motivo_fallo,
      run_id,
      recording_url
    } = req.body;

    const result = await query(
      `UPDATE prl_safety_calls 
       SET estado = COALESCE($1, estado),
           contacto_exitoso = COALESCE($2, contacto_exitoso),
           checklist_completado = COALESCE($3, checklist_completado),
           duracion_segundos = COALESCE($4, duracion_segundos),
           motivo_fallo = COALESCE($5, motivo_fallo),
           run_id = COALESCE($6, run_id),
           recording_url = COALESCE($7, recording_url),
           finalizada_at = CASE WHEN $1 IN ('COMPLETADA', 'FALLIDA', 'NO_RESPONDE') THEN NOW() ELSE finalizada_at END
       WHERE id = $8
       RETURNING *`,
      [estado, contacto_exitoso, checklist_completado, duracion_segundos, motivo_fallo, run_id, recording_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Llamada no encontrada' });
    }

    const call = result.rows[0];

    // Actualizar estado del trabajador
    if (estado === 'COMPLETADA' && checklist_completado) {
      await query(
        `UPDATE prl_workers 
         SET checklist_estado = 'COMPLETADO',
             checklist_completado_at = NOW()
         WHERE id = $1`,
        [call.worker_id]
      );
    } else if (estado === 'NO_RESPONDE' || estado === 'FALLIDA') {
      await query(
        `UPDATE prl_workers 
         SET checklist_estado = CASE 
           WHEN llamadas_intentadas >= 3 THEN 'NO_CONTACTADO'
           ELSE 'PENDIENTE'
         END
         WHERE id = $1`,
        [call.worker_id]
      );
    }

    // Emitir evento en tiempo real
    req.io.emit('prl:call:updated', call);

    res.json({
      success: true,
      call
    });

  } catch (error) {
    console.error('Error al actualizar llamada:', error);
    res.status(500).json({
      error: 'Error al actualizar llamada',
      details: error.message
    });
  }
});

// Obtener historial de llamadas
router.get('/calls', async (req, res) => {
  try {
    const { worker_id, estado, limit = 50 } = req.query;

    let queryText = `
      SELECT c.*, w.nombre_completo, w.employee_id, w.tipo_trabajo
      FROM prl_safety_calls c
      LEFT JOIN prl_workers w ON c.worker_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (worker_id) {
      queryText += ` AND c.worker_id = $${paramCount}`;
      params.push(worker_id);
      paramCount++;
    }

    if (estado) {
      queryText += ` AND c.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    queryText += ` ORDER BY c.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({
      success: true,
      calls: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener llamadas:', error);
    res.status(500).json({
      error: 'Error al obtener llamadas',
      details: error.message
    });
  }
});

// ===================================
// CHECKLISTS - Listas de Verificación
// ===================================

// Registrar checklist completado
router.post('/checklists', async (req, res) => {
  try {
    const {
      worker_id,
      respuestas,
      estado,
      observaciones,
      incidencias_detectadas,
      metodo = 'LLAMADA_TELEFONICA',
      verificado_por = 'Sistema Automatizado PRL',
      duracion_segundos
    } = req.body;

    if (!worker_id || !respuestas) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['worker_id', 'respuestas']
      });
    }

    const result = await query(
      `INSERT INTO prl_safety_checklists (
        worker_id, completado_at, duracion_segundos, respuestas,
        estado, observaciones, incidencias_detectadas, metodo, verificado_por
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        worker_id, duracion_segundos, JSON.stringify(respuestas),
        estado, observaciones, incidencias_detectadas, metodo, verificado_por
      ]
    );

    const checklist = result.rows[0];

    // Actualizar trabajador
    await query(
      `UPDATE prl_workers 
       SET checklist_estado = 'COMPLETADO',
           checklist_completado_at = NOW()
       WHERE id = $1`,
      [worker_id]
    );

    // Emitir evento en tiempo real
    req.io.emit('prl:checklist:completed', checklist);

    res.status(201).json({
      success: true,
      message: 'Checklist registrado exitosamente',
      checklist
    });

  } catch (error) {
    console.error('Error al registrar checklist:', error);
    res.status(500).json({
      error: 'Error al registrar checklist',
      details: error.message
    });
  }
});

// ===================================
// INCIDENTS - Incidentes PRL
// ===================================

// Obtener incidentes
router.get('/incidents', async (req, res) => {
  try {
    const { estado, tipo, limit = 50 } = req.query;

    let queryText = `
      SELECT i.*, w.nombre_completo, w.employee_id, s.planta
      FROM prl_incidents i
      LEFT JOIN prl_workers w ON i.worker_id = w.id
      LEFT JOIN prl_shifts s ON i.shift_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (estado) {
      queryText += ` AND i.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (tipo) {
      queryText += ` AND i.tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }

    queryText += ` ORDER BY i.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({
      success: true,
      incidents: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({
      error: 'Error al obtener incidentes',
      details: error.message
    });
  }
});

module.exports = router;
