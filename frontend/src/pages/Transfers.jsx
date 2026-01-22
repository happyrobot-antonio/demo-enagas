import { useEffect, useState, useRef, useCallback } from 'react'
import { Search, RefreshCw, ArrowRightLeft, UserCheck, ExternalLink } from 'lucide-react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import LiveIndicator from '../components/LiveIndicator'
import { api } from '../utils/api'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import { POLLING_INTERVALS } from '../config/polling'
import gsap from 'gsap'
import clsx from 'clsx'

const Transfers = () => {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const containerRef = useRef(null)
  const hasAnimated = useRef(false)
  const isInitialLoad = useRef(true)

  const fetchTransfers = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true)
      }
      const params = {}
      if (filterEstado) params.estado = filterEstado
      if (filterArea) params.area_destino = filterArea

      const response = await api.getTransfers(params)
      if (response.success) {
        setTransfers(response.transfers)
      }
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    } catch (error) {
      console.error('Error al cargar transferencias:', error)
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    }
  }, [filterEstado, filterArea])

  useEffect(() => {
    fetchTransfers()
    // Polling constante cada 4 segundos
    const interval = setInterval(fetchTransfers, POLLING_INTERVALS.TRANSFERS)
    return () => clearInterval(interval)
  }, [fetchTransfers])

  useEffect(() => {
    // Animación SOLO en carga inicial
    if (!loading && containerRef.current && !hasAnimated.current) {
      hasAnimated.current = true
      const cards = containerRef.current.querySelectorAll('.transfer-card')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
        }
      )
    }
  }, [loading, transfers])

  const filteredTransfers = transfers.filter((transfer) =>
    transfer.resumen_consulta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.area_destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transfer.datos_usuario?.nombre && transfer.datos_usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getEstadoColor = (estado) => {
    const colors = {
      'PENDIENTE': 'warning',
      'CONECTANDO': 'info',
      'TRANSFERIDO': 'success',
      'RECHAZADO': 'danger',
      'NO_DISPONIBLE': 'secondary',
    }
    return colors[estado] || 'default'
  }

  const getAreaColor = (area) => {
    const colors = {
      'Operaciones': 'info',
      'GTS Internacional': 'secondary',
      'Comercial': 'warning',
      'Medicion': 'success',
      'Sistemas e Infraestructuras': 'danger',
      'Regulacion': 'secondary',
      'Atencion Cliente': 'info',
    }
    return colors[area] || 'default'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transferencias a Especialistas</h1>
          <p className="text-muted-foreground mt-1">
            Consultas derivadas a equipos especializados
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator 
            interval={POLLING_INTERVALS.TRANSFERS}
            lastUpdate={transfers[0]?.created_at}
          />
          <Button onClick={fetchTransfers} disabled={loading}>
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} strokeWidth={1.5} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{transfers.length}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => ['PENDIENTE', 'CONECTANDO'].includes(t.estado)).length}
                </p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-yellow-500" strokeWidth={1.5} />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => t.estado === 'TRANSFERIDO').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-success" strokeWidth={1.5} />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => {
                    const today = new Date().toDateString()
                    return new Date(t.created_at).toDateString() === today
                  }).length}
                </p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-accent-blue" strokeWidth={1.5} />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por consulta, área o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="input"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONECTANDO">Conectando</option>
                <option value="TRANSFERIDO">Transferido</option>
                <option value="RECHAZADO">Rechazado</option>
                <option value="NO_DISPONIBLE">No Disponible</option>
              </select>
            </div>
            <div className="w-full md:w-64">
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="input"
              >
                <option value="">Todas las áreas</option>
                <option value="Operaciones">Operaciones</option>
                <option value="GTS Internacional">GTS Internacional</option>
                <option value="Comercial">Comercial</option>
                <option value="Medicion">Medición</option>
                <option value="Sistemas e Infraestructuras">Sistemas e Infraestructuras</option>
                <option value="Regulacion">Regulación</option>
                <option value="Atencion Cliente">Atención Cliente</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Transfers List */}
      <div ref={containerRef} className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-lg" />
            ))}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <Card>
            <Card.Content className="py-12">
              <div className="text-center text-muted-foreground">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" strokeWidth={1.5} />
                <p className="text-lg font-medium">No se encontraron transferencias</p>
                <p className="text-sm mt-1">
                  {searchTerm || filterEstado || filterArea
                    ? 'Intenta ajustar los filtros'
                    : 'Aún no hay transferencias registradas en el sistema'}
                </p>
              </div>
            </Card.Content>
          </Card>
        ) : (
          filteredTransfers.map((transfer) => (
            <Card key={transfer.id} className="transfer-card hover:shadow-md transition-shadow">
              <Card.Content className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={getAreaColor(transfer.area_destino)}>
                          {transfer.area_destino}
                        </Badge>
                        <Badge variant={getEstadoColor(transfer.estado)}>
                          {transfer.estado}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(transfer.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Consulta */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Resumen de la Consulta</p>
                    <p className="text-sm leading-relaxed">
                      {transfer.resumen_consulta}
                    </p>
                  </div>

                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Usuario</p>
                      <p className="text-sm font-medium">
                        {transfer.datos_usuario?.nombre || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Empresa</p>
                      <p className="text-sm font-medium">
                        {transfer.datos_usuario?.empresa || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                      <p className="text-sm font-medium">
                        {transfer.datos_usuario?.telefono || transfer.datos_usuario?.email || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  {/* Especialista Asignado */}
                  {transfer.especialista_asignado && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Especialista Asignado</p>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-success" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-success">
                          {transfer.especialista_asignado}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ticket Relacionado */}
                  {transfer.ticket_id && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Ticket Relacionado</p>
                      <p className="text-sm font-mono text-accent-blue">
                        {transfer.ticket_id}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{formatRelativeTime(transfer.created_at)}</span>
                      {transfer.happyrobot_link && (
                        <a
                          href={transfer.happyrobot_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" strokeWidth={2} />
                          <span className="font-medium">HappyRobot</span>
                        </a>
                      )}
                    </div>
                    <span className="font-mono">ID: {transfer.id.slice(0, 8)}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default Transfers
