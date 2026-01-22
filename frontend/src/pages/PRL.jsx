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
      const shifts = shiftsResponse.shifts || []
      
      if (shifts.length > 0) {
        const shift = shifts[0]
        setActiveShift(shift)

        // Get workers for this shift
        const workersResponse = await api.get(`/api/prl/workers?shift_id=${shift.id}`)
        const workersData = workersResponse.workers || []
        
        // Ordenar: primero críticos pendientes, luego pendientes, en curso, completados
        const sortedWorkers = workersData.sort((a, b) => {
          const priorityOrder = { 'CRITICA': 0, 'ALTA': 1, 'MEDIA': 2, 'BAJA': 3 }
          const statusOrder = { 'PENDIENTE': 0, 'NO_CONTACTADO': 1, 'EN_CURSO': 2, 'COMPLETADO': 3 }
          
          // Primero por estado
          if (statusOrder[a.checklist_estado] !== statusOrder[b.checklist_estado]) {
            return statusOrder[a.checklist_estado] - statusOrder[b.checklist_estado]
          }
          // Luego por prioridad
          return priorityOrder[a.prioridad] - priorityOrder[b.prioridad]
        })
        
        setWorkers(sortedWorkers)

        // Get stats
        const statsResponse = await api.get(`/api/prl/shifts/${shift.id}/stats`)
        setStats(statsResponse.stats || null)
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
      
      if (response.success) {
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
        <Button variant="warning" size="sm" disabled className="h-8 px-3 text-xs">
          <Phone className="h-3 w-3 mr-1.5 animate-pulse" />
          Iniciando...
        </Button>
      )
    }

    if (worker.checklist_estado === 'EN_CURSO') {
      return (
        <Button variant="warning" size="sm" disabled className="h-8 px-3 text-xs">
          <Phone className="h-3 w-3 mr-1.5 animate-pulse" />
          Llamando...
        </Button>
      )
    }

    if (worker.checklist_estado === 'COMPLETADO') {
      return (
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
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
          className="h-8 px-3 text-xs"
        >
          <Phone className="h-3 w-3 mr-1.5" />
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
            <Shield className="h-8 w-8 text-foreground" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold tracking-tight">Prevención de Riesgos Laborales</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {activeShift.planta} · Turno {activeShift.nombre} ({activeShift.hora_inicio} - {activeShift.hora_fin}) · Supervisor: {activeShift.supervisor}
            {stats && ` · ${stats.total_trabajadores} trabajadores`}
          </p>
        </div>
        <LiveIndicator />
      </div>

      {/* Workers List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Trabajadores del Turno</h2>
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{stats.completados} Completados</span>
                <span className="text-muted-foreground">·</span>
                <span>{stats.pendientes} Pendientes</span>
                <span className="text-muted-foreground">·</span>
                <span>{stats.en_curso} En Curso</span>
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          <div ref={containerRef} className="space-y-2">
            {workers.map((worker) => {
              const StatusIcon = getStatusIcon(worker)
              const statusColor = getStatusColor(worker)

              return (
                <div
                  key={worker.id}
                  className="worker-card border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Status Indicator */}
                    <div className="md:col-span-1 flex justify-center">
                      <StatusIcon
                        className={clsx(
                          'h-5 w-5',
                          statusColor === 'success' && 'text-green-600',
                          statusColor === 'warning' && 'text-yellow-600',
                          statusColor === 'danger' && 'text-red-600',
                          statusColor === 'default' && 'text-muted-foreground'
                        )}
                        strokeWidth={2}
                      />
                    </div>

                    {/* Worker Info */}
                    <div className="md:col-span-3">
                      <p className="font-semibold">{worker.nombre_completo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-muted-foreground">{worker.employee_id}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{worker.empresa}</span>
                      </div>
                    </div>

                    {/* Task */}
                    <div className="md:col-span-4">
                      <p className="text-sm font-medium">{worker.tipo_trabajo.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{worker.descripcion_tarea}</p>
                      <p className="text-xs text-muted-foreground font-mono">{worker.ubicacion_trabajo}</p>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <Badge variant={statusColor === 'success' ? 'success' : statusColor === 'danger' ? 'danger' : 'default'}>
                        {getStatusText(worker)}
                      </Badge>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2">
                      {getActionButton(worker)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default PRL
