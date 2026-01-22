// Instalaciones principales de Enagás en España (datos ficticios para demo)
export const INSTALLATIONS = [
  {
    id: 'huelva-compression',
    name: 'Planta de Compresión Huelva',
    type: 'compression',
    coordinates: [37.2592, -6.9500],
    capacity: '8 GWh',
    description: 'Planta principal de compresión en Andalucía',
    region: 'Andalucía'
  },
  {
    id: 'valladolid-regulation',
    name: 'Estación de Regulación Valladolid',
    type: 'regulation',
    coordinates: [41.6523, -4.7245],
    capacity: '12 GWh',
    description: 'Estación de regulación y medida',
    region: 'Castilla y León'
  },
  {
    id: 'barcelona-lng',
    name: 'Terminal GNL Barcelona',
    type: 'lng_terminal',
    coordinates: [41.3851, 2.1734],
    capacity: '15 GWh',
    description: 'Terminal de Gas Natural Licuado',
    region: 'Cataluña'
  },
  {
    id: 'zaragoza-compression',
    name: 'Planta de Compresión Zaragoza',
    type: 'compression',
    coordinates: [41.6488, -0.8891],
    capacity: '10 GWh',
    description: 'Planta de compresión en el valle del Ebro',
    region: 'Aragón'
  },
  {
    id: 'madrid-regulation',
    name: 'Estación de Regulación Madrid',
    type: 'regulation',
    coordinates: [40.4168, -3.7038],
    capacity: '18 GWh',
    description: 'Estación principal de regulación para el área metropolitana',
    region: 'Comunidad de Madrid'
  }
]

// Tipos de instalación con sus colores y iconos
export const INSTALLATION_TYPES = {
  compression: {
    label: 'Planta de Compresión',
    color: '#3b82f6',
    icon: '⚙️'
  },
  regulation: {
    label: 'Estación de Regulación',
    color: '#8b5cf6',
    icon: '📊'
  },
  lng_terminal: {
    label: 'Terminal GNL',
    color: '#06b6d4',
    icon: '🚢'
  }
}
