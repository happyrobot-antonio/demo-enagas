import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import io from 'socket.io-client'
import { flashNotification, badgeCountAnimation } from '../utils/animations'

const SocketContext = createContext()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket debe usarse dentro de un SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({
    tickets_abiertos: 0,
    emergencias_activas: 0,
    llamadas_en_curso: 0,
    transferencias_pendientes: 0,
    tickets_hoy: 0,
    emergencias_hoy: 0
  })

  // Listeners para eventos en tiempo real
  const [newTicket, setNewTicket] = useState(null)
  const [newEmergency, setNewEmergency] = useState(null)
  const [newTransfer, setNewTransfer] = useState(null)
  const [newCall, setNewCall] = useState(null)

  // Animation triggers
  const triggerNotificationAnimation = useCallback((type, data) => {
    // Find notification element if it exists
    const notificationArea = document.querySelector('.notification-area')
    if (notificationArea) {
      flashNotification(notificationArea, {
        backgroundColor: type === 'emergency' ? '#ef4444' : '#0066cc'
      })
    }

    // Animate badge counters in navigation
    const badges = document.querySelectorAll('.badge')
    badges.forEach(badge => {
      badgeCountAnimation(badge)
    })
  }, [])

  useEffect(() => {
    // Conectar al servidor WebSocket
    const socketInstance = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketInstance.on('connect', () => {
      console.log('✓ Conectado al servidor WebSocket')
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('✗ Desconectado del servidor WebSocket')
      setConnected(false)
    })

    socketInstance.on('connected', (data) => {
      console.log('Mensaje del servidor:', data.message)
    })

    // Escuchar eventos de tickets
    socketInstance.on('ticket:created', (ticket) => {
      console.log('Nuevo ticket:', ticket)
      setNewTicket(ticket)
      triggerNotificationAnimation('ticket', ticket)
      fetchStats()
    })

    socketInstance.on('ticket:updated', (ticket) => {
      console.log('Ticket actualizado:', ticket)
      fetchStats()
    })

    // Escuchar eventos de emergencias
    socketInstance.on('emergency:activated', (emergency) => {
      console.log('🚨 EMERGENCIA ACTIVADA:', emergency)
      setNewEmergency(emergency)
      triggerNotificationAnimation('emergency', emergency)
      
      // Notificación del navegador (si está permitido)
      if (Notification.permission === 'granted') {
        new Notification('🚨 EMERGENCIA ACTIVADA', {
          body: `${emergency.tipo_incidente} - ${emergency.ubicacion_completa}`,
          icon: '/alert-icon.png',
          tag: 'emergency'
        })
      }
      
      fetchStats()
    })

    socketInstance.on('emergency:updated', (emergency) => {
      console.log('Emergencia actualizada:', emergency)
      fetchStats()
    })

    // Escuchar eventos de transferencias
    socketInstance.on('transfer:created', (transfer) => {
      console.log('Nueva transferencia:', transfer)
      setNewTransfer(transfer)
      triggerNotificationAnimation('transfer', transfer)
      fetchStats()
    })

    // Escuchar eventos de llamadas
    socketInstance.on('call:started', (call) => {
      console.log('Nueva llamada:', call)
      setNewCall(call)
      triggerNotificationAnimation('call', call)
      fetchStats()
    })

    socketInstance.on('call:ended', (call) => {
      console.log('Llamada finalizada:', call)
      fetchStats()
    })

    setSocket(socketInstance)

    // Solicitar permisos de notificación
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Fetch inicial de estadísticas
    fetchStats()

    // Cleanup al desmontar
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`)
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
    }
  }

  const value = {
    socket,
    connected,
    stats,
    newTicket,
    newEmergency,
    newTransfer,
    newCall,
    refreshStats: fetchStats
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
