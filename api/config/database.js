const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determinar la ubicación de la base de datos
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'gts.db');

// Asegurar que el directorio data existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Directorio de datos creado:', dataDir);
}

// Crear/abrir base de datos SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err);
    process.exit(-1);
  } else {
    console.log('✓ Conexión establecida con SQLite:', DB_PATH);
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Función helper para ejecutar queries (compatible con API de pg)
const query = async (text, params = []) => {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    // Convertir sintaxis de PostgreSQL ($1, $2) a SQLite (?, ?)
    const sqliteQuery = text.replace(/\$\d+/g, '?');
    
    // Determinar si es SELECT o no
    const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect) {
      db.all(sqliteQuery, params, (err, rows) => {
        const duration = Date.now() - start;
        if (err) {
          console.error('Error en query:', err);
          reject(err);
        } else {
          console.log('Query ejecutada:', { 
            text: text.substring(0, 50) + '...', 
            duration, 
            rows: rows.length 
          });
          // Mantener compatibilidad con pg (devolver objeto con rows)
          resolve({ rows, rowCount: rows.length });
        }
      });
    } else {
      db.run(sqliteQuery, params, function(err) {
        const duration = Date.now() - start;
        if (err) {
          console.error('Error en query:', err);
          reject(err);
        } else {
          console.log('Query ejecutada:', { 
            text: text.substring(0, 50) + '...', 
            duration,
            changes: this.changes 
          });
          // Mantener compatibilidad con pg
          resolve({ 
            rows: [], 
            rowCount: this.changes,
            lastID: this.lastID 
          });
        }
      });
    }
  });
};

// Función para verificar la conexión
const checkConnection = async () => {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Error al verificar conexión:', error);
    return false;
  }
};

// Función para inicializar la base de datos
const initializeDatabase = async () => {
  const initSqlPath = path.join(__dirname, '..', '..', 'database', 'init-sqlite.sql');
  
  if (!fs.existsSync(initSqlPath)) {
    console.log('⚠ Archivo init-sqlite.sql no encontrado, saltando inicialización');
    return;
  }

  try {
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    // Ejecutar en una transacción
    return new Promise((resolve, reject) => {
      db.exec(initSql, (err) => {
        if (err) {
          console.error('Error al inicializar base de datos:', err);
          reject(err);
        } else {
          console.log('✓ Base de datos inicializada correctamente');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error al leer init-sqlite.sql:', error);
    throw error;
  }
};

// Cerrar conexión de manera elegante
const closeConnection = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err);
        reject(err);
      } else {
        console.log('✓ Conexión SQLite cerrada');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  query,
  checkConnection,
  initializeDatabase,
  closeConnection
};
