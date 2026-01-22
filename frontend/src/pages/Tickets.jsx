import { useEffect, useState, useRef, useCallback } from 'react'
import { Search, RefreshCw, ChevronDown } from 'lucide-react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import LiveIndicator from '../components/LiveIndicator'
import { api } from '../utils/api'
import { formatDate, formatRelativeTime, getPriorityColor, getEstadoColor } from '../utils/formatters'
import { POLLING_INTERVALS } from '../config/polling'
import gsap from 'gsap'
import clsx from 'clsx'

const Tickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState('')
  const [expandedTicket, setExpandedTicket] = useState(null)
  const containerRef = useRef(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterEstado) params.estado = filterEstado
      if (filterPrioridad) params.prioridad = filterPrioridad

      const response = await api.getTickets(params)
      if (response.success) {
        setTickets(response.tickets)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar tickets:', error)
      setLoading(false)
    }
  }, [filterEstado, filterPrioridad])

  useEffect(() => {
    fetchTickets()
    // Polling constante cada 3 segundos
    const interval = setInterval(fetchTickets, POLLING_INTERVALS.TICKETS)
    return () => clearInterval(interval)
  }, [fetchTickets])

  useEffect(() => {
    if (!loading && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.ticket-card')
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
  }, [loading, tickets])

  const filteredTickets = tickets.filter(ticket => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      ticket.numero_ticket.toLowerCase().includes(search) ||
      ticket.descripcion.toLowerCase().includes(search) ||
      ticket.sistema?.toLowerCase().includes(search) ||
      JSON.stringify(ticket.contacto).toLowerCase().includes(search)
    )
  })

  const toggleExpand = (ticketId) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1">Gestión de incidencias y consultas</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator 
            interval={POLLING_INTERVALS.TICKETS}
            lastUpdate={tickets[0]?.updated_at || tickets[0]?.created_at}
          />
          <Button onClick={fetchTickets} variant="outline" size="default">
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
                placeholder="Buscar tickets..."
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
              <option value="ABIERTO">Abierto</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="CERRADO">Cerrado</option>
              <option value="ESCALADO">Escalado</option>
            </select>

            {/* Prioridad filter */}
            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="input"
            >
              <option value="">Todas las prioridades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div className="mt-4 text-xs text-muted-foreground font-mono">
            {filteredTickets.length} tickets encontrados
          </div>
        </Card.Content>
      </Card>

      {/* Tickets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-48 rounded-lg" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted-foreground">No se encontraron tickets</p>
          </Card.Content>
        </Card>
      ) : (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="ticket-card hover:border-primary/50 cursor-pointer group"
              onClick={() => toggleExpand(ticket.id)}
            >
              <Card.Content className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">
                        {ticket.numero_ticket}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getPriorityColor(ticket.prioridad)}>
                          {ticket.prioridad}
                        </Badge>
                        <Badge variant={getEstadoColor(ticket.estado)}>
                          {ticket.estado}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown
                      className={clsx(
                        'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                        expandedTicket === ticket.id && 'rotate-180'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-semibold text-sm mb-1">
                      {ticket.tipo}
                    </h3>
                    {ticket.sistema && (
                      <p className="text-xs text-muted-foreground font-mono mb-2">
                        {ticket.sistema}
                      </p>
                    )}
                    <p className={clsx(
                      'text-sm text-muted-foreground',
                      expandedTicket !== ticket.id && 'line-clamp-2'
                    )}>
                      {ticket.descripcion}
                    </p>
                  </div>

                  {/* Expanded details */}
                  {expandedTicket === ticket.id && (
                    <div className="pt-3 border-t border-border space-y-2 animate-in">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Contacto</p>
                        <p className="text-sm font-medium">{ticket.contacto.nombre}</p>
                        {ticket.contacto.empresa && (
                          <p className="text-xs text-muted-foreground">{ticket.contacto.empresa}</p>
                        )}
                        {ticket.contacto.email && (
                          <p className="text-xs text-muted-foreground font-mono">{ticket.contacto.email}</p>
                        )}
                      </div>
                      {ticket.usuario_afectado && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Usuario afectado</p>
                          <p className="text-sm font-mono">{ticket.usuario_afectado}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                    <span>{formatDate(ticket.created_at)}</span>
                    <span>{formatRelativeTime(ticket.created_at)}</span>
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

export default Tickets
