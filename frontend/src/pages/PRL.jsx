import { useEffect, useState, useRef, useCallback } from 'react'
import { Shield, Phone, CheckCircle2, AlertTriangle, Clock, Users, HardHat } from 'lucide-react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Button from '../components/Button'
import LiveIndicator from '../components/LiveIndicator'
import { api } from '../utils/api'
import { formatRelativeTime } from '../utils/formatters'
import gsap from 'gsap'
import clsx from 'clsx'

const PRL = () => {
  const [activeShift, setActiveShift] = useState(null)
  const [workers, setWorkers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(null) // Worker ID being called
  const containerRef = useRef(null)
  const hasAnimated = useRef(false)
  const isInitialLoad = useRef(true)

  // Fetch active shift and workers
  const fetchData = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true)
      }

      // Get active shift
      const shiftsResponse = await api.get('/api/prl/shifts/active')
      const shifts = shiftsResponse.data.shifts || []
      
      if (shifts.length > 0) {
        const shift = shifts[0]
        setActiveShift(shift)

        // Get workers for this shift
        const workersResponse = await api.get(`/api/prl/workers?shift_id=${shift.id}`)
        setWorkers(workersResponse.data.workers || [])

        // Get stats
        const statsResponse = await api.get(`/api/prl/shifts/${shift.id}/stats`)
        setStats(statsResponse.data.stats || null)
      }

      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    } catch (error) {
      console.error('Error al cargar datos PRL:', error)
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [fetchData])

  // Animate workers cards on initial load
  useEffect(() => {
    if (!loading && workers.length > 0 && !hasAnimated.current && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.worker-card')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out'
        }
      )
      hasAnimated.current = true
    }
  }, [loading, workers])

  // Handle call initiation
  const handleCall = async (workerId) => {
    try {
      setCalling(workerId)
      const response = await api.post('/api/prl/calls/initiate', { worker_id: workerId })
      
      if (response.data.success) {
        // Refresh data to show updated status
        setTimeout(() => {
          fetchData()
          setCalling(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Error al iniciar llamada:', error)
      setCalling(null)
    }
  }

  // Get worker status color
  const getStatusColor = (worker) => {
    if (worker.checklist_estado === 'COMPLETADO') return 'success'
    if (worker.checklist_estado === 'EN_CURSO') return 'warning'
    if (worker.checklist_estado === 'NO_CONTACTADO') return 'danger'
    if (worker.checklist_estado === 'PENDIENTE' && worker.prioridad === 'CRITICA') return 'danger'
    if (worker.checklist_estado === 'PENDIENTE' && worker.prioridad === 'ALTA') return 'warning'
    return 'default'
  }

  // Get status icon
  const getStatusIcon = (worker) => {
    if (worker.checklist_estado === 'COMPLETADO') return CheckCircle2
    if (worker.checklist_estado === 'EN_CURSO') return Phone
    if (worker.checklist_estado === 'NO_CONTACTADO') return AlertTriangle
    return Clock
  }

  // Get status text
  const getStatusText = (worker) => {
    if (worker.checklist_estado === 'COMPLETADO') {
      return `Completado ${formatRelativeTime(worker.checklist_completado_at)}`
    }
    if (worker.checklist_estado === 'EN_CURSO') return 'Llamando ahora...'
    if (worker.checklist_estado === 'NO_CONTACTADO') {
      return `No contactado (${worker.llamadas_intentadas} intentos)`
    }
    if (worker.checklist_estado === 'PENDIENTE') return 'Pendiente de verificación'
    return worker.checklist_estado
  }

  // Get button for worker
  const getActionButton = (worker) => {
    if (calling === worker.id) {
      return (
        <Button variant="warning" size="sm" disabled className="w-full">
          <Phone className="h-4 w-4 mr-2 animate-pulse" />
          Iniciando...
        </Button>
      )
    }

    if (worker.checklist_estado === 'EN_CURSO') {
      return (
        <Button variant="warning" size="sm" disabled className="w-full">
          <Phone className="h-4 w-4 mr-2 animate-pulse" />
          Llamando...
        </Button>
      )
    }

    if (worker.checklist_estado === 'COMPLETADO') {
      return (
        <Button variant="ghost" size="sm" className="w-full">
          Ver Detalle
        </Button>
      )
    }

    if (worker.checklist_estado === 'PENDIENTE' || worker.checklist_estado === 'NO_CONTACTADO') {
      return (
        <Button
          variant={worker.prioridad === 'CRITICA' ? 'destructive' : 'primary'}
          size="sm"
          onClick={() => handleCall(worker.id)}
          className="w-full"
        >
          <Phone className="h-4 w-4 mr-2" />
          LLAMAR
        </Button>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando sistema PRL...</p>
        </div>
      </div>
    )
  }

  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No hay turnos activos en este momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-accent-blue" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold tracking-tight">Prevención de Riesgos Laborales</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Sistema de verificación y control de seguridad en operaciones críticas
          </p>
        </div>
        <LiveIndicator />
      </div>

      {/* Shift Info Card */}
      <Card className="bg-gradient-to-r from-accent-blue/10 to-transparent border-accent-blue/30">
        <Card.Content className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">PLANTA</p>
              <p className="font-semibold text-lg">{activeShift.planta}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">TURNO</p>
              <p className="font-semibold text-lg">{activeShift.nombre}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {activeShift.hora_inicio} - {activeShift.hora_fin}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">SUPERVISOR</p>
              <p className="font-semibold">{activeShift.supervisor}</p>
            </div>
            {stats && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_trabajadores}</p>
                    <p className="text-xs text-muted-foreground">Trabajadores</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <Card.Content className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">{stats.completados}</p>
                  <p className="text-sm text-muted-foreground mt-1">Completados</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </Card.Content>
          </Card>

          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <Card.Content className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
                  <p className="text-sm text-muted-foreground mt-1">Pendientes</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </Card.Content>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <Card.Content className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{stats.en_curso}</p>
                  <p className="text-sm text-muted-foreground mt-1">En Curso</p>
                </div>
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
            </Card.Content>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <Card.Content className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600">{stats.alertas}</p>
                  <p className="text-sm text-muted-foreground mt-1">Alertas</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </Card.Content>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <Card.Content className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">{stats.trabajos_criticos}</p>
                  <p className="text-sm text-muted-foreground mt-1">Críticos</p>
                </div>
                <HardHat className="h-8 w-8 text-orange-600" />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Workers List */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Trabajadores del Turno
        </h2>

        <div ref={containerRef} className="space-y-3">
          {workers.map((worker) => {
            const StatusIcon = getStatusIcon(worker)
            const statusColor = getStatusColor(worker)

            return (
              <Card
                key={worker.id}
                className={clsx(
                  'worker-card transition-all duration-200',
                  statusColor === 'danger' && 'border-red-500/50 bg-red-500/5',
                  statusColor === 'warning' && 'border-yellow-500/50 bg-yellow-500/5',
                  statusColor === 'success' && 'border-green-500/30'
                )}
              >
                <Card.Content className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Status Indicator */}
                    <div className="md:col-span-1 flex justify-center">
                      <div
                        className={clsx(
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          statusColor === 'success' && 'bg-green-500/20',
                          statusColor === 'warning' && 'bg-yellow-500/20',
                          statusColor === 'danger' && 'bg-red-500/20',
                          statusColor === 'default' && 'bg-muted'
                        )}
                      >
                        <StatusIcon
                          className={clsx(
                            'h-6 w-6',
                            statusColor === 'success' && 'text-green-600',
                            statusColor === 'warning' && 'text-yellow-600',
                            statusColor === 'danger' && 'text-red-600',
                            statusColor === 'default' && 'text-muted-foreground'
                          )}
                          strokeWidth={2}
                        />
                      </div>
                    </div>

                    {/* Worker Info */}
                    <div className="md:col-span-3">
                      <p className="font-semibold text-lg">{worker.nombre_completo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-muted-foreground">ID: {worker.employee_id}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{worker.empresa}</span>
                      </div>
                    </div>

                    {/* Task */}
                    <div className="md:col-span-4">
                      <Badge variant={worker.prioridad === 'CRITICA' ? 'danger' : 'default'} className="mb-2">
                        {worker.tipo_trabajo.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2">{worker.descripcion_tarea}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{worker.ubicacion_trabajo}</p>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium">{getStatusText(worker)}</p>
                      {worker.riesgos_identificados && worker.riesgos_identificados.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {worker.riesgos_identificados.length} riesgo(s) identificado(s)
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2">
                      {getActionButton(worker)}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PRL
