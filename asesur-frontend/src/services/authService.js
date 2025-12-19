const API_URL = 'http://localhost:3000/api' // Tu Backend

export const authService = {
  
  async login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    
    // Guardamos la sesión en LocalStorage para que no se cierre al recargar
    localStorage.setItem('user_session', JSON.stringify(data))
    return data
  },

  async register(email, password, nombre, rol) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre, rol })
    })
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  },

  logout() {
    localStorage.removeItem('user_session')
    window.location.href = '/' // Redirigir al login
  },

  // Recuperar sesión guardada
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user_session'))
  }
}