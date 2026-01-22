const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Activar protocolo de emergencia (tool: activate_emergency_protocol)
router.post('/', async (req, res) => {
  try {
    const {
      tipo_incidente,
      ubicacion_completa,
      contacto_llamante,
      descripcion_situacion,
      nivel_riesgo,
      coordenadas,
      municipio,
      provincia,
      run_id
    } = req.body;

    // Validaciones
    if (!tipo_incidente || !ubicacion_completa || !contacto_llamante || !descripcion_situacion || !nivel_riesgo) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['tipo_incidente', 'ubicacion_completa', 'contacto_llamante', 'descripcion_situacion', 'nivel_riesgo']
      });
    }

    // Calcular tiempo estimado de llegada según ubicación y tipo
    const tiemposLlegada = {
      'CRITICO': 15,
      'ALTO': 25,
      'MEDIO': 40,
      'BAJO': 60
    };

    const tiempo_estimado_llegada = tiemposLlegada[nivel_riesgo] || 40;

    const result = await query(
      `INSERT INTO emergencies (
        tipo_incidente, ubicacion_completa, contacto_llamante,
        descripcion_situacion, nivel_riesgo, coordenadas,
        municipio, provincia, tiempo_estimado_llegada, run_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tipo_incidente, ubicacion_completa, JSON.stringify(contacto_llamante),
        descripcion_situacion, nivel_riesgo, coordenadas ? JSON.stringify(coordenadas) : null,
        municipio, provincia, tiempo_estimado_llegada, run_id
      ]
    );

    const emergency = result.rows[0];

    // Generar link a HappyRobot si existe run_id
    if (emergency.run_id) {
      emergency.happyrobot_link = `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${emergency.run_id}`;
    }

    // Emitir alerta crítica en tiempo real
    req.io.emit('emergency:activated', {
      ...emergency,
      alert: 'EMERGENCIA ACTIVADA',
      priority: 'URGENT'
    });

    res.status(201).json({
      success: true,
      message: 'Protocolo de emergencia activado',
      emergency,
      tiempo_estimado_llegada: `${tiempo_estimado_llegada} minutos`
    });

  } catch (error) {
    console.error('Error al activar emergencia:', error);
    res.status(500).json({
      error: 'Error al activar protocolo de emergencia',
      details: error.message
    });
  }
});

// Obtener todas las emergencias
router.get('/', async (req, res) => {
  try {
    const { estado, tipo_incidente, nivel_riesgo, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM emergencies WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (estado) {
      queryText += ` AND estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (tipo_incidente) {
      queryText += ` AND tipo_incidente = $${paramCount}`;
      params.push(tipo_incidente);
      paramCount++;
    }

    if (nivel_riesgo) {
      queryText += ` AND nivel_riesgo = $${paramCount}`;
      params.push(nivel_riesgo);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Agregar link a HappyRobot para emergencias con run_id
    const emergenciesWithLinks = result.rows.map(emergency => ({
      ...emergency,
      happyrobot_link: emergency.run_id 
        ? `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${emergency.run_id}`
        : null
    }));

    const countResult = await query('SELECT COUNT(*) FROM emergencies WHERE 1=1');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      emergencies: emergenciesWithLinks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error al obtener emergencias:', error);
    res.status(500).json({
      error: 'Error al obtener emergencias',
      details: error.message
    });
  }
});

// Obtener emergencias activas
router.get('/active', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM emergencies 
       WHERE estado IN ('ACTIVA', 'EN_ATENCION') 
       ORDER BY nivel_riesgo DESC, created_at DESC`
    );

    // Agregar link a HappyRobot para emergencias con run_id
    const emergenciesWithLinks = result.rows.map(emergency => ({
      ...emergency,
      happyrobot_link: emergency.run_id 
        ? `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${emergency.run_id}`
        : null
    }));

    res.json({
      success: true,
      emergencies: emergenciesWithLinks,
      count: emergenciesWithLinks.length
    });

  } catch (error) {
    console.error('Error al obtener emergencias activas:', error);
    res.status(500).json({
      error: 'Error al obtener emergencias activas',
      details: error.message
    });
  }
});

// Obtener una emergencia específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM emergencies WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Emergencia no encontrada'
      });
    }

    res.json({
      success: true,
      emergency: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener emergencia:', error);
    res.status(500).json({
      error: 'Error al obtener emergencia',
      details: error.message
    });
  }
});

// Actualizar una emergencia
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['estado', 'equipo_asignado', 'atendida_at', 'resuelta_at'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        error: 'No hay campos válidos para actualizar'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE emergencies SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Emergencia no encontrada'
      });
    }

    const emergency = result.rows[0];

    // Emitir actualización en tiempo real
    req.io.emit('emergency:updated', emergency);

    res.json({
      success: true,
      message: 'Emergencia actualizada',
      emergency
    });

  } catch (error) {
    console.error('Error al actualizar emergencia:', error);
    res.status(500).json({
      error: 'Error al actualizar emergencia',
      details: error.message
    });
  }
});

module.exports = router;
