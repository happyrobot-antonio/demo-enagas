import { useEffect, useState, useRef } from 'react'
import { FileText, AlertTriangle, Phone, ArrowRightLeft, Activity, ChevronDown } from 'lucide-react'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { DashboardStatsSkeleton } from '../components/Skeleton'
import LiveIndicator from '../components/LiveIndicator'
import { useRealTimeStats, useRealTimeEmergencies, useRealTimeTickets } from '../hooks/useRealTimeData'
import { POLLING_INTERVALS } from '../config/polling'
import { api } from '../utils/api'
import { formatRelativeTime, getEstadoColor, getRiesgoColor } from '../utils/formatters'
import gsap from 'gsap'
import clsx from 'clsx'

const Dashboard = () => {
  // Hooks de tiempo real con polling constante
  const { stats, loading: statsLoading } = useRealTimeStats(POLLING_INTERVALS.STATS)
  const { emergencies: activeEmergencies, loading: emergenciesLoading } = useRealTimeEmergencies(POLLING_INTERVALS.EMERGENCIES)
  const { tickets: recentTickets, loading: ticketsLoading } = useRealTimeTickets(POLLING_INTERVALS.TICKETS)
  
  const [systemStatus, setSystemStatus] = useState([])
  const [expandedTicket, setExpandedTicket] = useState(null)
  const containerRef = useRef(null)
  const hasAnimated = useRef(false)

  const loading = statsLoading || emergenciesLoading || ticketsLoading

  useEffect(() => {
    fetchSystemStatus()
    // Polling para system status cada 10 segundos
    const interval = setInterval(fetchSystemStatus, POLLING_INTERVALS.SYSTEM_STATUS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Stagger animation SOLO en carga inicial
    if (!loading && containerRef.current && !hasAnimated.current) {
      hasAnimated.current = true
      const elements = containerRef.current.querySelectorAll('.animate-item')
      gsap.fromTo(
        elements,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      )
    }
  }, [loading])

  const fetchSystemStatus = async () => {
    try {
      const systemsRes = await api.getSystemStatus()
      if (systemsRes.success) {
        setSystemStatus(systemsRes.systems)
      }
    } catch (error) {
      console.error('Error al cargar estado de sistemas:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-5 w-96" />
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-96 rounded-lg" />
          <div className="skeleton h-96 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Notification Area (for animation triggers) */}
      <div className="notification-area fixed top-20 right-6 z-50 pointer-events-none" />

      {/* Header */}
      <div className="animate-item">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-muted-foreground mt-1">Monitorización en tiempo real del sistema GTS</p>
          </div>
          <LiveIndicator 
            interval={POLLING_INTERVALS.STATS}
            lastUpdate={stats?.last_update || new Date().toISOString()}
          />
        </div>
      </div>

      {/* Bento Grid - Stats */}
      <div className="animate-item grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tickets Abiertos"
          value={stats?.tickets_abiertos || 0}
          icon={FileText}
          subtitle={`${stats?.tickets_hoy || 0} hoy`}
        />
        <StatCard
          title="Emergencias Activas"
          value={activeEmergencies?.length || 0}
          icon={AlertTriangle}
          subtitle={`${stats?.emergencias_hoy || 0} hoy`}
        />
        <StatCard
          title="Llamadas en Curso"
          value={stats?.llamadas_en_curso || 0}
          icon={Phone}
        />
        <StatCard
          title="Transferencias"
          value={stats?.transferencias_pendientes || 0}
          icon={ArrowRightLeft}
        />
      </div>

      {/* Emergency Alert - Full Width */}
      {activeEmergencies.length > 0 && (
        <div className="animate-item">
          <Card className="border-destructive/50 bg-destructive/5">
            <Card.Header>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                <Card.Title className="text-destructive">Emergencias Activas</Card.Title>
                <Badge variant="danger">{activeEmergencies.length}</Badge>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {activeEmergencies.map((emergency) => (
                  <div
                    key={emergency.id}
                    className="relative border-l-2 border-destructive pl-4 py-3 rounded-r-md bg-background/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">
                            {emergency.codigo_emergencia}
                          </span>
                          <Badge variant="danger">{emergency.tipo_incidente}</Badge>
                          <Badge variant={getRiesgoColor(emergency.nivel_riesgo)}>
                            {emergency.nivel_riesgo}
                          </Badge>
                        </div>
                        <p className="font-semibold">{emergency.ubicacion_completa}</p>
                        <p className="text-sm text-muted-foreground">{emergency.descripcion_situacion}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatRelativeTime(emergency.created_at)}
                        </p>
                      </div>
                      <Badge variant={getEstadoColor(emergency.estado)}>
                        {emergency.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="animate-item">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Tickets Recientes</Card.Title>
                <Badge variant="info">{recentTickets.length}</Badge>
              </div>
              <Card.Description>Últimas incidencias reportadas</Card.Description>
            </Card.Header>
            <Card.Content>
              {recentTickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No hay tickets abiertos
                </p>
              ) : (
                <div className="space-y-2">
                  {recentTickets.slice(0, 5).map((ticket) => (
                    <div
                      key={ticket.id}
                      className={clsx(
                        'group relative border-l-2 pl-3 py-2 rounded-r cursor-pointer transition-all',
                        'border-accent-blue hover:bg-secondary/50',
                        expandedTicket === ticket.id && 'bg-secondary/50'
                      )}
                      onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">
                              {ticket.numero_ticket}
                            </span>
                            <Badge variant={getEstadoColor(ticket.estado)} className="text-[10px]">
                              {ticket.estado}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate">
                            {ticket.tipo} - {ticket.sistema || 'General'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ticket.descripcion}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatRelativeTime(ticket.created_at)}
                          </p>
                        </div>
                        <ChevronDown
                          className={clsx(
                            'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                            expandedTicket === ticket.id && 'rotate-180'
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* System Status */}
        <div className="animate-item">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Estado de Sistemas</Card.Title>
                <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <Card.Description>Monitorización de servicios</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {systemStatus.map((system) => (
                  <div
                    key={system.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{system.sistema}</p>
                      {system.mensaje && (
                        <p className="text-xs text-muted-foreground truncate">{system.mensaje}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={clsx(
                          'h-2 w-2 rounded-full',
                          system.estado === 'OPERATIVO' && 'bg-success animate-pulse-slow',
                          system.estado === 'DEGRADADO' && 'bg-yellow-500',
                          system.estado === 'MANTENIMIENTO' && 'bg-accent-blue',
                          system.estado === 'CAIDO' && 'bg-destructive'
                        )}
                      />
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          system.estado === 'OPERATIVO' && 'text-success',
                          system.estado === 'DEGRADADO' && 'text-yellow-600',
                          system.estado === 'MANTENIMIENTO' && 'text-accent-blue',
                          system.estado === 'CAIDO' && 'text-destructive'
                        )}
                      >
                        {system.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
