import { useEffect, useState, useRef, useCallback } from 'react'
import { Search, RefreshCw, MapPin, Clock, ExternalLink } from 'lucide-react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import LiveIndicator from '../components/LiveIndicator'
import { api } from '../utils/api'
import { formatDate, formatRelativeTime, getRiesgoColor, getEstadoColor } from '../utils/formatters'
import { POLLING_INTERVALS } from '../config/polling'
import gsap from 'gsap'
import clsx from 'clsx'

const Emergencies = () => {
  const [emergencies, setEmergencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterRiesgo, setFilterRiesgo] = useState('')
  const containerRef = useRef(null)
  const hasAnimated = useRef(false)
  const isInitialLoad = useRef(true)

  const fetchEmergencies = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true)
      }
      const params = {}
      if (filterEstado) params.estado = filterEstado
      if (filterRiesgo) params.nivel_riesgo = filterRiesgo

      const response = await api.getEmergencies(params)
      if (response.success) {
        setEmergencies(response.emergencies)
      }
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    } catch (error) {
      console.error('Error al cargar emergencias:', error)
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    }
  }, [filterEstado, filterRiesgo])

  useEffect(() => {
    fetchEmergencies()
    // Polling constante cada 2 segundos
    const interval = setInterval(fetchEmergencies, POLLING_INTERVALS.EMERGENCIES)
    return () => clearInterval(interval)
  }, [fetchEmergencies])

  useEffect(() => {
    // Animación SOLO en carga inicial
    if (!loading && containerRef.current && !hasAnimated.current) {
      hasAnimated.current = true
      const cards = containerRef.current.querySelectorAll('.emergency-card')
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: 'back.out(1.2)',
        }
      )
    }
  }, [loading, emergencies])

  const filteredEmergencies = emergencies.filter(emergency => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      emergency.codigo_emergencia.toLowerCase().includes(search) ||
      emergency.ubicacion_completa.toLowerCase().includes(search) ||
      emergency.descripcion_situacion.toLowerCase().includes(search) ||
      JSON.stringify(emergency.contacto_llamante).toLowerCase().includes(search)
    )
  })

  const getBorderColor = (nivel) => {
    switch (nivel) {
      case 'CRITICO':
        return 'border-l-4 border-l-red-600'
      case 'ALTO':
        return 'border-l-4 border-l-orange-500'
      case 'MEDIO':
        return 'border-l-4 border-l-yellow-500'
      case 'BAJO':
        return 'border-l-4 border-l-green-500'
      default:
        return 'border-l-4 border-l-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergencias</h1>
          <p className="text-muted-foreground mt-1">Protocolos de emergencia activados</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator 
            interval={POLLING_INTERVALS.EMERGENCIES}
            lastUpdate={emergencies[0]?.updated_at || emergencies[0]?.created_at}
          />
          <Button onClick={fetchEmergencies} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <Card.Content className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <Input
                type="text"
                placeholder="Buscar emergencias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Estado filter */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activa</option>
              <option value="EN_ATENCION">En Atención</option>
              <option value="CONTROLADA">Controlada</option>
              <option value="RESUELTA">Resuelta</option>
              <option value="FALSA_ALARMA">Falsa Alarma</option>
            </select>

            {/* Riesgo filter */}
            <select
              value={filterRiesgo}
              onChange={(e) => setFilterRiesgo(e.target.value)}
              className="input"
            >
              <option value="">Todos los niveles</option>
              <option value="CRITICO">Crítico</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Medio</option>
              <option value="BAJO">Bajo</option>
            </select>
          </div>

          <div className="mt-4 text-xs text-muted-foreground font-mono">
            {filteredEmergencies.length} emergencias encontradas
          </div>
        </Card.Content>
      </Card>

      {/* Emergencies List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-lg" />
          ))}
        </div>
      ) : filteredEmergencies.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted-foreground">No se encontraron emergencias</p>
          </Card.Content>
        </Card>
      ) : (
        <div ref={containerRef} className="space-y-4">
          {filteredEmergencies.map((emergency) => (
            <Card
              key={emergency.id}
              className={clsx(
                'emergency-card hover:border-primary/50',
                getBorderColor(emergency.nivel_riesgo)
              )}
            >
              <Card.Content className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">
                          {emergency.codigo_emergencia}
                        </span>
                        <Badge variant="danger">{emergency.tipo_incidente}</Badge>
                        <Badge variant={getRiesgoColor(emergency.nivel_riesgo)}>
                          {emergency.nivel_riesgo}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={getEstadoColor(emergency.estado)}>
                      {emergency.estado}
                    </Badge>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="font-semibold">{emergency.ubicacion_completa}</p>
                      {(emergency.municipio || emergency.provincia) && (
                        <p className="text-sm text-muted-foreground font-mono mt-1">
                          {emergency.municipio}{emergency.municipio && emergency.provincia && ', '}{emergency.provincia}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm">{emergency.descripcion_situacion}</p>
                  </div>

                  {/* Contact & Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Contacto del llamante</p>
                      <p className="text-sm font-semibold">{emergency.contacto_llamante.nombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">{emergency.contacto_llamante.telefono}</p>
                      {emergency.contacto_llamante.empresa && (
                        <p className="text-xs text-muted-foreground">{emergency.contacto_llamante.empresa}</p>
                      )}
                    </div>

                    {emergency.equipo_asignado && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Equipo asignado</p>
                        <p className="text-sm">{emergency.equipo_asignado}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                    <div className="flex items-center gap-4">
                      <span>{formatRelativeTime(emergency.created_at)}</span>
                      {emergency.tiempo_estimado_llegada && emergency.estado === 'ACTIVA' && (
                        <div className="flex items-center gap-1 text-destructive font-medium">
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          <span>ETA: {emergency.tiempo_estimado_llegada} min</span>
                        </div>
                      )}
                      {emergency.happyrobot_link && (
                        <a
                          href={emergency.happyrobot_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" strokeWidth={2} />
                          <span className="font-medium">Ver en HappyRobot</span>
                        </a>
                      )}
                    </div>
                    <span>{formatDate(emergency.created_at)}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Emergencies
