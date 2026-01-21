import { useEffect, useState, useRef } from 'react'
import { Search, RefreshCw, Phone as PhoneIcon, Clock } from 'lucide-react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { api } from '../utils/api'
import { formatDate, formatRelativeTime, formatDuration, getEstadoColor } from '../utils/formatters'
import { useSocket } from '../context/SocketContext'
import gsap from 'gsap'
import clsx from 'clsx'

const Calls = () => {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const { newCall } = useSocket()
  const containerRef = useRef(null)

  useEffect(() => {
    fetchCalls()
  }, [filterEstado, filterTipo, newCall])

  useEffect(() => {
    if (!loading && containerRef.current) {
      const items = containerRef.current.querySelectorAll('.call-item')
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
        }
      )
    }
  }, [loading, calls])

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterEstado) params.estado = filterEstado
      if (filterTipo) params.tipo_consulta = filterTipo

      const response = await api.getCalls(params)
      if (response.success) {
        setCalls(response.calls)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar llamadas:', error)
      setLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      call.nombre_llamante?.toLowerCase().includes(search) ||
      call.empresa?.toLowerCase().includes(search) ||
      call.telefono?.toLowerCase().includes(search) ||
      call.categoria?.toLowerCase().includes(search)
    )
  })

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'EMERGENCIA':
        return 'danger'
      case 'INCIDENCIA':
        return 'warning'
      case 'CONSULTA_OPERATIVA':
        return 'info'
      case 'CONSULTA_ADMINISTRATIVA':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Llamadas</h1>
          <p className="text-muted-foreground mt-1">Registro de llamadas recibidas</p>
        </div>
        <Button onClick={fetchCalls} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Actualizar
        </Button>
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
                placeholder="Buscar llamadas..."
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
              <option value="EN_CURSO">En Curso</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="TRANSFERIDA">Transferida</option>
              <option value="CORTADA">Cortada</option>
            </select>

            {/* Tipo filter */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="input"
            >
              <option value="">Todos los tipos</option>
              <option value="EMERGENCIA">Emergencia</option>
              <option value="INCIDENCIA">Incidencia</option>
              <option value="CONSULTA_OPERATIVA">Consulta Operativa</option>
              <option value="CONSULTA_ADMINISTRATIVA">Consulta Administrativa</option>
            </select>
          </div>

          <div className="mt-4 text-xs text-muted-foreground font-mono">
            {filteredCalls.length} llamadas encontradas
          </div>
        </Card.Content>
      </Card>

      {/* Timeline View */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
      ) : filteredCalls.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted-foreground">No se encontraron llamadas</p>
          </Card.Content>
        </Card>
      ) : (
        <div ref={containerRef} className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {filteredCalls.map((call) => (
              <div key={call.id} className="call-item relative pl-12">
                {/* Timeline dot */}
                <div
                  className={clsx(
                    'absolute left-2.5 top-6 w-3 h-3 rounded-full border-2 border-background',
                    call.estado === 'EN_CURSO' ? 'bg-success animate-pulse-slow' : 'bg-muted'
                  )}
                />

                <Card className="hover:border-primary/50">
                  <Card.Content className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={clsx(
                            'flex items-center justify-center w-10 h-10 rounded-full',
                            call.estado === 'EN_CURSO' ? 'bg-success/10' : 'bg-secondary'
                          )}>
                            <PhoneIcon
                              className={clsx(
                                'h-5 w-5',
                                call.estado === 'EN_CURSO' ? 'text-success' : 'text-muted-foreground'
                              )}
                              strokeWidth={1.5}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {call.nombre_llamante || 'Sin nombre'}
                            </p>
                            {call.empresa && (
                              <p className="text-sm text-muted-foreground truncate">{call.empresa}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={getEstadoColor(call.estado)}>
                          {call.estado}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {call.telefono && (
                            <div>
                              <p className="text-xs text-muted-foreground">Teléfono</p>
                              <p className="text-sm font-mono">{call.telefono}</p>
                            </div>
                          )}
                          {call.tipo_consulta && (
                            <div>
                              <Badge variant={getTipoColor(call.tipo_consulta)}>
                                {call.tipo_consulta}
                              </Badge>
                            </div>
                          )}
                          {call.categoria && (
                            <div>
                              <p className="text-xs text-muted-foreground">Categoría</p>
                              <p className="text-sm">{call.categoria}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {call.duracion_segundos ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                              <span className="text-sm font-mono">
                                {formatDuration(call.duracion_segundos)}
                              </span>
                            </div>
                          ) : call.estado === 'EN_CURSO' && (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-success animate-pulse-slow" />
                              <span className="text-sm text-success font-medium">En curso</span>
                            </div>
                          )}

                          {call.notas && (
                            <div>
                              <p className="text-xs text-muted-foreground">Notas</p>
                              <p className="text-sm line-clamp-2">{call.notas}</p>
                            </div>
                          )}

                          {call.resolucion && (
                            <div>
                              <p className="text-xs text-muted-foreground">Resolución</p>
                              <p className="text-sm line-clamp-2">{call.resolucion}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                        <span>{formatRelativeTime(call.started_at)}</span>
                        <span>{formatDate(call.started_at)}</span>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Calls
