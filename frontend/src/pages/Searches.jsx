import { useEffect, useState, useRef } from 'react'
import { Search, RefreshCw, TrendingUp, FileSearch } from 'lucide-react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { api } from '../utils/api'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import gsap from 'gsap'
import clsx from 'clsx'

const Searches = () => {
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipoProceso, setFilterTipoProceso] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    fetchSearches()
  }, [filterTipoProceso])

  useEffect(() => {
    if (!loading && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.search-card')
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
  }, [loading, searches])

  const fetchSearches = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterTipoProceso) params.tipo_proceso = filterTipoProceso

      const response = await api.getSearches(params)
      if (response.success) {
        setSearches(response.searches)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar búsquedas:', error)
      setLoading(false)
    }
  }

  const filteredSearches = searches.filter((search) =>
    search.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (search.usuario_solicitante && search.usuario_solicitante.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTipoProcesoColor = (tipo) => {
    const colors = {
      'habilitacion': 'info',
      'programacion': 'warning',
      'medicion': 'success',
      'balance': 'secondary',
      'liquidacion': 'secondary',
      'garantias': 'info',
      'contratacion': 'warning',
      'facturacion': 'secondary',
      'otro': 'default',
    }
    return colors[tipo] || 'default'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Búsquedas en Documentación</h1>
          <p className="text-muted-foreground mt-1">
            Historial de consultas en la base de conocimiento del GTS
          </p>
        </div>
        <Button onClick={fetchSearches} disabled={loading}>
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} strokeWidth={1.5} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Búsquedas</p>
                <p className="text-2xl font-bold">{searches.length}</p>
              </div>
              <FileSearch className="h-8 w-8 text-accent-blue" strokeWidth={1.5} />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Búsquedas Hoy</p>
                <p className="text-2xl font-bold">
                  {searches.filter(s => {
                    const today = new Date().toDateString()
                    return new Date(s.created_at).toDateString() === today
                  }).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" strokeWidth={1.5} />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tipo Más Frecuente</p>
                <p className="text-lg font-bold capitalize">
                  {searches.length > 0 ? (
                    (() => {
                      const counts = searches.reduce((acc, s) => {
                        acc[s.tipo_proceso] = (acc[s.tipo_proceso] || 0) + 1
                        return acc
                      }, {})
                      const entries = Object.entries(counts)
                      const sorted = entries.sort((a, b) => b[1] - a[1])
                      return sorted[0]?.[0] || 'N/A'
                    })()
                  ) : 'N/A'}
                </p>
              </div>
              <Search className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
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
                placeholder="Buscar por términos o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterTipoProceso}
                onChange={(e) => setFilterTipoProceso(e.target.value)}
                className="input"
              >
                <option value="">Todos los procesos</option>
                <option value="habilitacion">Habilitación</option>
                <option value="programacion">Programación</option>
                <option value="medicion">Medición</option>
                <option value="balance">Balance</option>
                <option value="liquidacion">Liquidación</option>
                <option value="garantias">Garantías</option>
                <option value="contratacion">Contratación</option>
                <option value="facturacion">Facturación</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Searches List */}
      <div ref={containerRef} className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredSearches.length === 0 ? (
          <Card>
            <Card.Content className="py-12">
              <div className="text-center text-muted-foreground">
                <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" strokeWidth={1.5} />
                <p className="text-lg font-medium">No se encontraron búsquedas</p>
                <p className="text-sm mt-1">
                  {searchTerm || filterTipoProceso
                    ? 'Intenta ajustar los filtros'
                    : 'Aún no hay búsquedas registradas en el sistema'}
                </p>
              </div>
            </Card.Content>
          </Card>
        ) : (
          filteredSearches.map((search) => (
            <Card key={search.id} className="search-card hover:shadow-md transition-shadow">
              <Card.Content className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={getTipoProcesoColor(search.tipo_proceso)}>
                          {search.tipo_proceso || 'otro'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(search.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                        <span className="break-words">{search.query}</span>
                      </h3>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Usuario Solicitante</p>
                      <p className="text-sm font-medium">
                        {search.usuario_solicitante || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resultados Encontrados</p>
                      <p className="text-sm font-medium">
                        {search.resultados_count || 0} documento{search.resultados_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Context */}
                  {search.contexto && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Contexto</p>
                      <p className="text-sm text-muted-foreground bg-secondary/30 rounded px-3 py-2">
                        {search.contexto}
                      </p>
                    </div>
                  )}

                  {/* Documents Found */}
                  {search.documentos_encontrados && search.documentos_encontrados.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Documentos Encontrados</p>
                      <div className="space-y-1">
                        {search.documentos_encontrados.map((doc, idx) => (
                          <div key={idx} className="text-sm bg-accent-blue/5 border border-accent-blue/20 rounded px-3 py-2">
                            <p className="font-medium text-accent-blue">{doc.titulo}</p>
                            {doc.seccion && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sección: {doc.seccion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(search.created_at)}</span>
                    <span className="font-mono">ID: {search.id.slice(0, 8)}</span>
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

export default Searches
