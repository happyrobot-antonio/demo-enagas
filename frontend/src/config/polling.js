// Configuración de intervalos de polling para simular tiempo real
export const POLLING_INTERVALS = {
  EMERGENCIES: 2000,      // 2s - Crítico, máxima prioridad
  CALLS: 3000,            // 3s - Importante
  TICKETS: 3000,          // 3s - Importante
  SEARCHES: 4000,         // 4s - Normal
  TRANSFERS: 4000,        // 4s - Normal
  STATS: 5000,            // 5s - Resumen general
  SYSTEM_STATUS: 10000    // 10s - Baja prioridad
};
