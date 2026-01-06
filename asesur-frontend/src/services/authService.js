// ✅ Apuntamos al servidor de Render en la nube
const API_URL = 'https://asesur-platform.onrender.com/api' 

export const authService = {
  
  async login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
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
    // Ahora sí enviará los datos a Render
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
    window.location.href = '/' 
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user_session'))
  }
}