// API URL dinámica
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const authService = {
  
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    
    localStorage.setItem('user_session', JSON.stringify(data))
    return data
  },

  async register(email, password, nombre, rol) {
    const response = await fetch(`${API_URL}/auth/register`, {
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
    window.location.href = '/' 
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user_session'))
  }
}