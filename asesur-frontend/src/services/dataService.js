const API_URL = 'https://asesur-platform.onrender.com/api'

// Helper para obtener el token de sesión
const getAuthToken = () => {
  const session = localStorage.getItem('user_session')
  if (session) {
    const data = JSON.parse(session)
    return data.token || data.access_token
  }
  return null
}

export const dataService = {
  async getDashboardData() {
    const token = getAuthToken()
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/dashboard`, {
      headers
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }
}