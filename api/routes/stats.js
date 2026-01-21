const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Obtener estadísticas generales del dashboard
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stats_summary');

    const stats = result.rows[0] || {
      tickets_abiertos: 0,
      emergencias_activas: 0,
      llamadas_en_curso: 0,
      transferencias_pendientes: 0,
      tickets_hoy: 0,
      emergencias_hoy: 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// Estadísticas de tickets por tipo
router.get('/tickets-by-type', async (req, res) => {
  try {
    const result = await query(
      `SELECT tipo, COUNT(*) as total
       FROM tickets
       GROUP BY tipo
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas por tipo:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// Estadísticas de tickets por prioridad
router.get('/tickets-by-priority', async (req, res) => {
  try {
    const result = await query(
      `SELECT prioridad, COUNT(*) as total
       FROM tickets
       GROUP BY prioridad
       ORDER BY 
         CASE prioridad
           WHEN 'CRITICA' THEN 1
           WHEN 'ALTA' THEN 2
           WHEN 'MEDIA' THEN 3
           WHEN 'BAJA' THEN 4
         END`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas por prioridad:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// Actividad de las últimas 24 horas
router.get('/activity-24h', async (req, res) => {
  try {
    const ticketsResult = await query(
      `SELECT DATE_TRUNC('hour', created_at) as hora, COUNT(*) as total
       FROM tickets
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY hora
       ORDER BY hora ASC`
    );

    const emergenciesResult = await query(
      `SELECT DATE_TRUNC('hour', created_at) as hora, COUNT(*) as total
       FROM emergencies
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY hora
       ORDER BY hora ASC`
    );

    res.json({
      success: true,
      tickets: ticketsResult.rows,
      emergencies: emergenciesResult.rows
    });

  } catch (error) {
    console.error('Error al obtener actividad 24h:', error);
    res.status(500).json({
      error: 'Error al obtener actividad',
      details: error.message
    });
  }
});

// Estadísticas de emergencias por tipo
router.get('/emergencies-by-type', async (req, res) => {
  try {
    const result = await query(
      `SELECT tipo_incidente, COUNT(*) as total
       FROM emergencies
       GROUP BY tipo_incidente
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de emergencias:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// Transferencias por área
router.get('/transfers-by-area', async (req, res) => {
  try {
    const result = await query(
      `SELECT area_destino, COUNT(*) as total
       FROM transfers
       GROUP BY area_destino
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de transferencias:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

module.exports = router;
