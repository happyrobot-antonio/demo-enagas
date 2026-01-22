require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { checkConnection } = require('./config/database');

// Importar rutas
const ticketsRouter = require('./routes/tickets');
const emergenciesRouter = require('./routes/emergencies');
const transfersRouter = require('./routes/transfers');
const searchesRouter = require('./routes/searches');
const systemRouter = require('./routes/system');
const statsRouter = require('./routes/stats');
const callsRouter = require('./routes/calls');
const prlRouter = require('./routes/prl');

const app = express();
const server = http.createServer(app);

// Configurar Socket.IO con CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hacer io disponible en todas las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Logger de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas de la API
app.use('/api/tickets', ticketsRouter);
app.use('/api/emergencies', emergenciesRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/searches', searchesRouter);
app.use('/api/system-status', systemRouter);
app.use('/api/stats', statsRouter);
app.use('/api/calls', callsRouter);
app.use('/api/prl', prlRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Mesa de Servicios GTS - Enagás',
    version: '1.1.0',
    endpoints: {
      health: '/health',
      tickets: '/api/tickets',
      emergencies: '/api/emergencies',
      transfers: '/api/transfers',
      searches: '/api/searches',
      systemStatus: '/api/system-status',
      stats: '/api/stats',
      calls: '/api/calls',
      prl: '/api/prl'
    },
    prl: {
      description: 'Prevención de Riesgos Laborales',
      available: true
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  });
});

// Socket.IO - Manejo de conexiones
io.on('connection', (socket) => {
  console.log('✓ Cliente conectado vía WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('✗ Cliente desconectado:', socket.id);
  });

  // Enviar mensaje de bienvenida
  socket.emit('connected', {
    message: 'Conectado al servidor GTS en tiempo real',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// DEBUG: Ver qué variables llegan
console.log('🔍 DEBUG - Variables de entorno:');
console.log('PORT:', process.env.PORT);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('Puerto que se usará:', PORT);
console.log('---');

const startServer = async () => {
  try {
    // Verificar conexión a base de datos
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      console.error('✗ No se pudo conectar a la base de datos');
      console.log('Reintentando en 5 segundos...');
      setTimeout(startServer, 5000);
      return;
    }

    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      console.log('');
      console.log('================================================');
      console.log(`🚀 Servidor GTS API iniciado en puerto ${PORT}`);
      console.log(`📡 WebSocket server activo`);
      console.log(`🗄️  Base de datos conectada`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('================================================');
      console.log('');
    });

  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };
