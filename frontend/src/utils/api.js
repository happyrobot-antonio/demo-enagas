const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error en la solicitud')
      }

      return data
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error)
      throw error
    }
  }

  // Tickets
  async getTickets(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/tickets${queryString ? `?${queryString}` : ''}`)
  }

  async getTicket(id) {
    return this.request(`/api/tickets/${id}`)
  }

  async createTicket(data) {
    return this.request('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTicket(id, data) {
    return this.request(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getOpenTickets() {
    return this.request('/api/tickets/status/open')
  }

  // Emergencias
  async getEmergencies(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/emergencies${queryString ? `?${queryString}` : ''}`)
  }

  async getActiveEmergencies() {
    return this.request('/api/emergencies/active')
  }

  async createEmergency(data) {
    return this.request('/api/emergencies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmergency(id, data) {
    return this.request(`/api/emergencies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Transferencias
  async getTransfers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/transfers${queryString ? `?${queryString}` : ''}`)
  }

  async createTransfer(data) {
    return this.request('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Búsquedas en documentación
  async getSearches(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/searches${queryString ? `?${queryString}` : ''}`)
  }

  async getRecentSearches() {
    return this.request('/api/searches/recent')
  }

  // Llamadas
  async getCalls(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/calls${queryString ? `?${queryString}` : ''}`)
  }

  async getActiveCalls() {
    return this.request('/api/calls/active')
  }

  async createCall(data) {
    return this.request('/api/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async endCall(id, data) {
    return this.request(`/api/calls/${id}/end`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Estadísticas
  async getStats() {
    return this.request('/api/stats')
  }

  async getTicketsByType() {
    return this.request('/api/stats/tickets-by-type')
  }

  async getTicketsByPriority() {
    return this.request('/api/stats/tickets-by-priority')
  }

  async getActivity24h() {
    return this.request('/api/stats/activity-24h')
  }

  async getEmergenciesByType() {
    return this.request('/api/stats/emergencies-by-type')
  }

  async getTransfersByArea() {
    return this.request('/api/stats/transfers-by-area')
  }

  // Estado de sistemas
  async getSystemStatus() {
    return this.request('/api/system-status')
  }

  async updateSystemStatus(id, data) {
    return this.request(`/api/system-status/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient(API_URL)
