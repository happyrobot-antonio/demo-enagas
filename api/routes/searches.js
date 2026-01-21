const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Registrar búsqueda en documentación (tool: search_gts_documentation)
router.post('/', async (req, res) => {
  try {
    const {
      query: searchQuery,
      tipo_proceso,
      usuario_solicitante,
      contexto,
      resultados_count = 0,
      documentos_encontrados
    } = req.body;

    // Validaciones
    if (!searchQuery) {
      return res.status(400).json({
        error: 'El campo "query" es requerido'
      });
    }

    const result = await query(
      `INSERT INTO documentation_searches (
        query, tipo_proceso, usuario_solicitante, 
        contexto, resultados_count, documentos_encontrados
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        searchQuery,
        tipo_proceso || 'consulta_general',
        usuario_solicitante || 'Usuario GTS',
        contexto || 'Búsqueda desde agente de voz',
        resultados_count,
        documentos_encontrados ? JSON.stringify(documentos_encontrados) : null
      ]
    );

    const search = result.rows[0];

    // Emitir evento en tiempo real
    req.io.emit('search:performed', search);

    res.status(201).json({
      success: true,
      message: 'Búsqueda registrada',
      search
    });

  } catch (error) {
    console.error('Error al registrar búsqueda:', error);
    res.status(500).json({
      error: 'Error al registrar búsqueda',
      details: error.message
    });
  }
});

// Obtener historial de búsquedas
router.get('/', async (req, res) => {
  try {
    const { tipo_proceso, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM documentation_searches WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (tipo_proceso) {
      queryText += ` AND tipo_proceso = $${paramCount}`;
      params.push(tipo_proceso);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const countResult = await query('SELECT COUNT(*) FROM documentation_searches');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      searches: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error al obtener búsquedas:', error);
    res.status(500).json({
      error: 'Error al obtener búsquedas',
      details: error.message
    });
  }
});

// Obtener búsquedas recientes
router.get('/recent', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM documentation_searches 
       ORDER BY created_at DESC 
       LIMIT 20`
    );

    res.json({
      success: true,
      searches: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener búsquedas recientes:', error);
    res.status(500).json({
      error: 'Error al obtener búsquedas recientes',
      details: error.message
    });
  }
});

// Obtener estadísticas de búsquedas
router.get('/stats', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        tipo_proceso,
        COUNT(*) as total,
        AVG(resultados_count) as promedio_resultados
       FROM documentation_searches
       WHERE tipo_proceso IS NOT NULL
       GROUP BY tipo_proceso
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      stats: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de búsquedas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

module.exports = router;
