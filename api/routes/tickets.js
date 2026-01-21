const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Crear nuevo ticket (tool: create_gts_ticket)
router.post('/', async (req, res) => {
  try {
    const {
      descripcion,
      nombre_contacto,
      telefono_contacto,
      email_contacto,
      empresa_contacto,
      tipo = 'INCIDENCIA_TECNICA',
      usuario_afectado,
      sistema,
      prioridad = 'MEDIA',
      notas
    } = req.body;

    // Validación mínima: solo descripción es obligatoria
    if (!descripcion) {
      return res.status(400).json({
        error: 'Campo "descripcion" es requerido'
      });
    }

    // Construir objeto contacto con valores por defecto
    const contacto = {
      nombre: nombre_contacto || 'Usuario GTS',
      telefono: telefono_contacto || 'No especificado',
      email: email_contacto || 'no-especificado@gts.es',
      empresa: empresa_contacto || 'GTS'
    };

    // Calcular tiempo de respuesta estimado según prioridad
    const tiemposRespuesta = {
      'CRITICA': 60,    // 1 hora
      'ALTA': 240,      // 4 horas
      'MEDIA': 1440,    // 1 día
      'BAJA': 4320      // 3 días
    };

    const tiempo_respuesta_estimado = tiemposRespuesta[prioridad] || 1440;

    const result = await query(
      `INSERT INTO tickets (
        tipo, descripcion, usuario_afectado, sistema, 
        contacto, prioridad, tiempo_respuesta_estimado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [tipo, descripcion, usuario_afectado, sistema, 
       JSON.stringify(contacto), prioridad, tiempo_respuesta_estimado, notas]
    );

    const ticket = result.rows[0];

    // Emitir evento en tiempo real vía WebSocket
    req.io.emit('ticket:created', ticket);

    res.status(201).json({
      success: true,
      message: 'Ticket creado exitosamente',
      ticket
    });

  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(500).json({
      error: 'Error al crear ticket',
      details: error.message
    });
  }
});

// Obtener todos los tickets con filtros opcionales
router.get('/', async (req, res) => {
  try {
    const { estado, prioridad, tipo, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (estado) {
      queryText += ` AND estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (prioridad) {
      queryText += ` AND prioridad = $${paramCount}`;
      params.push(prioridad);
      paramCount++;
    }

    if (tipo) {
      queryText += ` AND tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Obtener total de tickets para paginación
    const countResult = await query('SELECT COUNT(*) FROM tickets WHERE 1=1');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      tickets: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({
      error: 'Error al obtener tickets',
      details: error.message
    });
  }
});

// Obtener un ticket específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      });
    }

    res.json({
      success: true,
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener ticket:', error);
    res.status(500).json({
      error: 'Error al obtener ticket',
      details: error.message
    });
  }
});

// Actualizar un ticket
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Campos actualizables
    const allowedFields = ['estado', 'notas', 'prioridad', 'resolved_at'];
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
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      });
    }

    const ticket = result.rows[0];

    // Emitir evento en tiempo real
    req.io.emit('ticket:updated', ticket);

    res.json({
      success: true,
      message: 'Ticket actualizado',
      ticket
    });

  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    res.status(500).json({
      error: 'Error al actualizar ticket',
      details: error.message
    });
  }
});

// Obtener tickets abiertos (dashboard)
router.get('/status/open', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM tickets 
       WHERE estado IN ('ABIERTO', 'EN_PROCESO') 
       ORDER BY prioridad DESC, created_at DESC 
       LIMIT 20`
    );

    res.json({
      success: true,
      tickets: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener tickets abiertos:', error);
    res.status(500).json({
      error: 'Error al obtener tickets abiertos',
      details: error.message
    });
  }
});

module.exports = router;
