const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Verificar estado de sistemas (tool: check_system_status)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM system_status ORDER BY sistema ASC`
    );

    res.json({
      success: true,
      systems: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener estado de sistemas:', error);
    res.status(500).json({
      error: 'Error al obtener estado de sistemas',
      details: error.message
    });
  }
});

// Verificar estado de un sistema específico
router.get('/:sistema', async (req, res) => {
  try {
    const { sistema } = req.params;

    const result = await query(
      'SELECT * FROM system_status WHERE sistema = $1',
      [sistema]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Sistema no encontrado'
      });
    }

    res.json({
      success: true,
      system: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener estado del sistema:', error);
    res.status(500).json({
      error: 'Error al obtener estado del sistema',
      details: error.message
    });
  }
});

// Actualizar estado de un sistema
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, mensaje, mantenimiento_programado, inicio_mantenimiento, fin_mantenimiento } = req.body;

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (estado) {
      fields.push(`estado = $${paramCount}`);
      values.push(estado);
      paramCount++;
    }

    if (mensaje !== undefined) {
      fields.push(`mensaje = $${paramCount}`);
      values.push(mensaje);
      paramCount++;
    }

    if (mantenimiento_programado !== undefined) {
      fields.push(`mantenimiento_programado = $${paramCount}`);
      values.push(mantenimiento_programado);
      paramCount++;
    }

    if (inicio_mantenimiento) {
      fields.push(`inicio_mantenimiento = $${paramCount}`);
      values.push(inicio_mantenimiento);
      paramCount++;
    }

    if (fin_mantenimiento) {
      fields.push(`fin_mantenimiento = $${paramCount}`);
      values.push(fin_mantenimiento);
      paramCount++;
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE system_status SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Sistema no encontrado'
      });
    }

    const system = result.rows[0];

    // Emitir actualización en tiempo real
    req.io.emit('system:updated', system);

    res.json({
      success: true,
      message: 'Estado del sistema actualizado',
      system
    });

  } catch (error) {
    console.error('Error al actualizar sistema:', error);
    res.status(500).json({
      error: 'Error al actualizar sistema',
      details: error.message
    });
  }
});

// Obtener sistemas con problemas
router.get('/status/issues', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM system_status 
       WHERE estado IN ('DEGRADADO', 'CAIDO', 'MANTENIMIENTO')
       ORDER BY updated_at DESC`
    );

    res.json({
      success: true,
      systems: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener sistemas con problemas:', error);
    res.status(500).json({
      error: 'Error al obtener sistemas con problemas',
      details: error.message
    });
  }
});

module.exports = router;
