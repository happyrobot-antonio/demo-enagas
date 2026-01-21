import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export const formatRelativeTime = (date) => {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export const formatDuration = (seconds) => {
  if (!seconds) return '-'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export const getPriorityColor = (prioridad) => {
  const colors = {
    'CRITICA': 'danger',
    'ALTA': 'warning',
    'MEDIA': 'info',
    'BAJA': 'default'
  }
  return colors[prioridad] || 'default'
}

export const getEstadoColor = (estado) => {
  const colors = {
    'ABIERTO': 'warning',
    'EN_PROCESO': 'info',
    'RESUELTO': 'success',
    'CERRADO': 'default',
    'ACTIVA': 'danger',
    'EN_ATENCION': 'warning',
    'CONTROLADA': 'info',
    'RESUELTA': 'success',
    'EN_CURSO': 'info',
    'FINALIZADA': 'default',
    'TRANSFERIDA': 'purple'
  }
  return colors[estado] || 'default'
}

export const getRiesgoColor = (nivel) => {
  const colors = {
    'CRITICO': 'danger',
    'ALTO': 'warning',
    'MEDIO': 'info',
    'BAJO': 'success'
  }
  return colors[nivel] || 'default'
}
