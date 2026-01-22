const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Registrar transferencia a especialista (tool: transfer_to_specialist)
router.post('/', async (req, res) => {
  try {
    const {
      area_destino,
      resumen_consulta,
      datos_usuario,
      ticket_id,
      run_id
    } = req.body;

    // Validaciones
    if (!area_destino || !resumen_consulta || !datos_usuario) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['area_destino', 'resumen_consulta', 'datos_usuario']
      });
    }

    const result = await query(
      `INSERT INTO transfers (
        area_destino, resumen_consulta, datos_usuario, ticket_id, estado, run_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [area_destino, resumen_consulta, JSON.stringify(datos_usuario), ticket_id, 'PENDIENTE', run_id]
    );

    const transfer = result.rows[0];

    // Generar link a HappyRobot si existe run_id
    if (transfer.run_id) {
      transfer.happyrobot_link = `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${transfer.run_id}`;
    }

    // Emitir evento en tiempo real
    req.io.emit('transfer:created', transfer);

    res.status(201).json({
      success: true,
      message: 'Transferencia registrada',
      transfer
    });

  } catch (error) {
    console.error('Error al registrar transferencia:', error);
    res.status(500).json({
      error: 'Error al registrar transferencia',
      details: error.message
    });
  }
});

// Obtener todas las transferencias
router.get('/', async (req, res) => {
  try {
    const { estado, area_destino, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM transfers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (estado) {
      queryText += ` AND estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (area_destino) {
      queryText += ` AND area_destino = $${paramCount}`;
      params.push(area_destino);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Agregar link a HappyRobot para transferencias con run_id
    const transfersWithLinks = result.rows.map(transfer => ({
      ...transfer,
      happyrobot_link: transfer.run_id 
        ? `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${transfer.run_id}`
        : null
    }));

    const countResult = await query('SELECT COUNT(*) FROM transfers');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      transfers: transfersWithLinks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    res.status(500).json({
      error: 'Error al obtener transferencias',
      details: error.message
    });
  }
});

// Obtener una transferencia específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM transfers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Transferencia no encontrada'
      });
    }

    res.json({
      success: true,
      transfer: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener transferencia:', error);
    res.status(500).json({
      error: 'Error al obtener transferencia',
      details: error.message
    });
  }
});

// Actualizar una transferencia
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, especialista_asignado } = req.body;

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (estado) {
      fields.push(`estado = $${paramCount}`);
      values.push(estado);
      paramCount++;
    }

    if (especialista_asignado) {
      fields.push(`especialista_asignado = $${paramCount}`);
      values.push(especialista_asignado);
      paramCount++;
    }

    if (estado === 'TRANSFERIDO') {
      fields.push(`transferido_at = NOW()`);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE transfers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Transferencia no encontrada'
      });
    }

    const transfer = result.rows[0];

    // Emitir actualización en tiempo real
    req.io.emit('transfer:updated', transfer);

    res.json({
      success: true,
      message: 'Transferencia actualizada',
      transfer
    });

  } catch (error) {
    console.error('Error al actualizar transferencia:', error);
    res.status(500).json({
      error: 'Error al actualizar transferencia',
      details: error.message
    });
  }
});

module.exports = router;
