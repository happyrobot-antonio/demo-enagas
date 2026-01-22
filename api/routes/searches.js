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
      documentos_encontrados,
      run_id
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
        contexto, resultados_count, documentos_encontrados, run_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        searchQuery,
        tipo_proceso,
        usuario_solicitante,
        contexto,
        resultados_count,
        documentos_encontrados ? JSON.stringify(documentos_encontrados) : null,
        run_id
      ]
    );

    const search = result.rows[0];

    // Generar link a HappyRobot si existe run_id
    if (search.run_id) {
      search.happyrobot_link = `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${search.run_id}`;
    }

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

    // Agregar link a HappyRobot para búsquedas con run_id
    const searchesWithLinks = result.rows.map(search => ({
      ...search,
      happyrobot_link: search.run_id 
        ? `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${search.run_id}`
        : null
    }));

    const countResult = await query('SELECT COUNT(*) FROM documentation_searches');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      searches: searchesWithLinks,
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

    // Agregar link a HappyRobot para búsquedas con run_id
    const searchesWithLinks = result.rows.map(search => ({
      ...search,
      happyrobot_link: search.run_id 
        ? `https://v2.platform.happyrobot.ai/antonio/workflow/shzu8lzuhftc/runs?run_id=${search.run_id}`
        : null
    }));

    res.json({
      success: true,
      searches: searchesWithLinks,
      count: searchesWithLinks.length
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
