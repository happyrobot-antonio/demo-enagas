import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { INSTALLATIONS, INSTALLATION_TYPES } from '../data/installations'

const InstallationsMap = ({ emergencies = [], tickets = [], height = '500px' }) => {
  
  // Determinar el color del marcador según el estado de la instalación
  const getMarkerColor = (installation) => {
    // Filtrar emergencias que mencionen esta instalación
    const installationEmergencies = emergencies.filter(e => 
      e.ubicacion_completa?.includes(installation.name) ||
      e.ubicacion_completa?.includes(installation.region)
    )
    
    // Filtrar tickets que mencionen esta instalación
    const installationTickets = tickets.filter(t => 
      t.ubicacion?.includes(installation.name) ||
      t.ubicacion?.includes(installation.region)
    )
    
    // Lógica de prioridad de colores
    if (installationEmergencies.length > 0) return '#ef4444'      // Rojo: Emergencias
    if (installationTickets.some(t => t.prioridad === 'alta')) return '#f97316' // Naranja: Tickets críticos
    if (installationTickets.length > 0) return '#3b82f6'          // Azul: Tickets normales
    return '#22c55e'                                               // Verde: Todo OK
  }

  // Obtener estadísticas de la instalación
  const getInstallationStats = (installation) => {
    const emergenciesCount = emergencies.filter(e => 
      e.ubicacion_completa?.includes(installation.name) ||
      e.ubicacion_completa?.includes(installation.region)
    ).length
    
    const ticketsCount = tickets.filter(t => 
      t.ubicacion?.includes(installation.name) ||
      t.ubicacion?.includes(installation.region)
    ).length
    
    return { emergenciesCount, ticketsCount }
  }

  // Obtener lista de incidencias específicas
  const getInstallationIncidents = (installation) => {
    const installationEmergencies = emergencies.filter(e => 
      e.ubicacion_completa?.includes(installation.name) ||
      e.ubicacion_completa?.includes(installation.region)
    )
    
    const installationTickets = tickets.filter(t => 
      t.ubicacion?.includes(installation.name) ||
      t.ubicacion?.includes(installation.region)
    )
    
    return {
      emergencies: installationEmergencies,
      tickets: installationTickets
    }
  }

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={[40.4168, -3.7038]} // Centro de España
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {INSTALLATIONS.map((installation) => {
          const markerColor = getMarkerColor(installation)
          const stats = getInstallationStats(installation)
          const incidents = getInstallationIncidents(installation)
          const installationType = INSTALLATION_TYPES[installation.type]
          
          return (
            <CircleMarker
              key={installation.id}
              center={installation.coordinates}
              radius={12}
              pathOptions={{
                fillColor: markerColor,
                fillOpacity: 0.8,
                color: 'white',
                weight: 2
              }}
              className="installation-marker"
            >
              {/* Tooltip al pasar el ratón */}
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-sm">
                  <div className="font-semibold mb-1">{installation.name}</div>
                  <div className="text-xs space-y-0.5">
                    {stats.emergenciesCount > 0 && (
                      <div className="text-red-600 font-medium">
                        {stats.emergenciesCount} emergencia{stats.emergenciesCount !== 1 ? 's' : ''} activa{stats.emergenciesCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {stats.ticketsCount > 0 && (
                      <div className="text-blue-600">
                        {stats.ticketsCount} ticket{stats.ticketsCount !== 1 ? 's' : ''} abierto{stats.ticketsCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {stats.emergenciesCount === 0 && stats.ticketsCount === 0 && (
                      <div className="text-green-600">Operando normalmente</div>
                    )}
                  </div>
                </div>
              </Tooltip>
              
              {/* Popup al hacer click */}
              <Popup maxWidth={300} className="installation-popup">
                <div className="text-sm">
                  <div className="border-b border-border pb-2 mb-2">
                    <h3 className="font-bold text-base mb-1">{installation.name}</h3>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>{installationType.icon} {installationType.label}</div>
                      <div>Capacidad: {installation.capacity}</div>
                      <div>{installation.region}</div>
                    </div>
                  </div>
                  
                  {incidents.emergencies.length > 0 && (
                    <div className="mb-3">
                      <div className="font-semibold text-red-600 mb-1.5 text-xs">
                        EMERGENCIAS ACTIVAS ({incidents.emergencies.length}):
                      </div>
                      <ul className="space-y-1 text-xs">
                        {incidents.emergencies.slice(0, 3).map((emergency, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1.5 text-red-500">•</span>
                            <span className="flex-1">
                              {emergency.tipo_incidente} - {emergency.nivel_riesgo}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {incidents.emergencies.length > 3 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{incidents.emergencies.length - 3} más...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {incidents.tickets.length > 0 && (
                    <div className="mb-2">
                      <div className="font-semibold text-blue-600 mb-1.5 text-xs">
                        TICKETS ABIERTOS ({incidents.tickets.length}):
                      </div>
                      <ul className="space-y-1 text-xs">
                        {incidents.tickets.slice(0, 3).map((ticket, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1.5 text-blue-500">•</span>
                            <span className="flex-1">
                              {ticket.tipo} - {ticket.prioridad}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {incidents.tickets.length > 3 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{incidents.tickets.length - 3} más...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {incidents.emergencies.length === 0 && incidents.tickets.length === 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Instalación operando con normalidad
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      
      {/* Leyenda */}
      <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs font-semibold mb-2">Estado de Instalaciones</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
            <span>Emergencias activas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 border border-white"></div>
            <span>Tickets críticos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
            <span>Tickets normales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
            <span>Operando normalmente</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallationsMap
