import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, AlertTriangle, Shield, Activity, Search } from 'lucide-react'
import { useSocket } from '../context/SocketContext'
import ThemeToggle from './ThemeToggle'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import clsx from 'clsx'

const Layout = ({ children }) => {
  const location = useLocation()
  const { connected, stats } = useSocket()
  const headerRef = useRef(null)
  const pageRef = useRef(null)

  const navigation = [
    { name: 'Panel de Control', path: '/', icon: Home },
    { name: 'Tickets', path: '/tickets', icon: FileText, badge: stats.tickets_abiertos },
    { name: 'Emergencias', path: '/emergencies', icon: AlertTriangle, badge: stats.emergencias_activas },
    { name: 'Búsquedas', path: '/searches', icon: Search },
    { name: 'PRL', path: '/prl', icon: Shield },
  ]

  // Page transition animation
  useEffect(() => {
    gsap.fromTo(
      pageRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    )
  }, [location.pathname])

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 10) {
          headerRef.current.classList.add('backdrop-blur-xl', 'bg-background/80', 'border-b')
        } else {
          headerRef.current.classList.remove('backdrop-blur-xl', 'bg-background/80', 'border-b')
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground gradient-mesh">
      {/* Minimal Header */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Mesa de Servicios GTS</span>
              <span className="text-[10px] text-muted-foreground font-mono">Real-time Monitoring</span>
            </div>
          </div>

          {/* Right side - Connection & Theme */}
          <div className="flex items-center space-x-4">
            {/* Connection status */}
            <div className="flex items-center space-x-2">
              <div
                className={clsx(
                  'h-2 w-2 rounded-full transition-colors',
                  connected ? 'bg-success animate-pulse-slow' : 'bg-destructive'
                )}
              />
              {!connected && (
                <span className="text-xs text-muted-foreground">Desconectado</span>
              )}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Side Navigation Rail */}
      <aside className="fixed left-0 top-16 bottom-0 w-24 border-r border-border bg-background/50 backdrop-blur-sm z-40">
        {/* Logo Enagás - GRANDE */}
        <div className="flex items-center justify-center py-8 border-b border-border">
          <img 
            src="/enagas-logo.png" 
            alt="Enagás" 
            className="w-20 h-auto"
          />
        </div>
        
        <nav className="flex flex-col items-center py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'relative group flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-blue rounded-r-full" />
                )}

                <Icon className="h-6 w-6" strokeWidth={1.5} />
                <span className="text-[10px] font-medium mt-1 tracking-tight">{item.name.slice(0, 5)}</span>

                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-blue text-[11px] font-semibold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}

                {/* Tooltip on hover */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-foreground text-background text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg">
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pl-24 pt-16">
        <div ref={pageRef} className="max-w-screen-2xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="pl-24 border-t border-border bg-background/50 backdrop-blur-sm mt-12">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center font-mono">
            © 2026 Enagás GTS
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
