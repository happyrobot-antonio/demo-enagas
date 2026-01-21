const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Registrar nueva llamada
router.post('/', async (req, res) => {
  try {
    const {
      nombre_llamante,
      empresa,
      telefono,
      tipo_consulta,
      categoria,
      notas
    } = req.body;

    const result = await query(
      `INSERT INTO calls (
        nombre_llamante, empresa, telefono, 
        tipo_consulta, categoria, notas, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [nombre_llamante, empresa, telefono, tipo_consulta, categoria, notas, 'EN_CURSO']
    );

    const call = result.rows[0];

    // Emitir evento en tiempo real
    req.io.emit('call:started', call);

    res.status(201).json({
      success: true,
      message: 'Llamada registrada',
      call
    });

  } catch (error) {
    console.error('Error al registrar llamada:', error);
    res.status(500).json({
      error: 'Error al registrar llamada',
      details: error.message
    });
  }
});

// Obtener todas las llamadas
router.get('/', async (req, res) => {
  try {
    const { estado, tipo_consulta, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM calls WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (estado) {
      queryText += ` AND estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (tipo_consulta) {
      queryText += ` AND tipo_consulta = $${paramCount}`;
      params.push(tipo_consulta);
      paramCount++;
    }

    queryText += ` ORDER BY started_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const countResult = await query('SELECT COUNT(*) FROM calls');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      calls: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error al obtener llamadas:', error);
    res.status(500).json({
      error: 'Error al obtener llamadas',
      details: error.message
    });
  }
});

// Finalizar una llamada
router.patch('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { duracion_segundos, resolucion, notas } = req.body;

    const fields = ['estado = $1', 'ended_at = NOW()'];
    const values = ['FINALIZADA'];
    let paramCount = 2;

    if (duracion_segundos) {
      fields.push(`duracion_segundos = $${paramCount}`);
      values.push(duracion_segundos);
      paramCount++;
    }

    if (resolucion) {
      fields.push(`resolucion = $${paramCount}`);
      values.push(resolucion);
      paramCount++;
    }

    if (notas) {
      fields.push(`notas = $${paramCount}`);
      values.push(notas);
      paramCount++;
    }

    values.push(id);

    const result = await query(
      `UPDATE calls SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Llamada no encontrada'
      });
    }

    const call = result.rows[0];

    // Emitir evento en tiempo real
    req.io.emit('call:ended', call);

    res.json({
      success: true,
      message: 'Llamada finalizada',
      call
    });

  } catch (error) {
    console.error('Error al finalizar llamada:', error);
    res.status(500).json({
      error: 'Error al finalizar llamada',
      details: error.message
    });
  }
});

// Obtener llamadas activas
router.get('/active', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM calls 
       WHERE estado = 'EN_CURSO'
       ORDER BY started_at DESC`
    );

    res.json({
      success: true,
      calls: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener llamadas activas:', error);
    res.status(500).json({
      error: 'Error al obtener llamadas activas',
      details: error.message
    });
  }
});

module.exports = router;
