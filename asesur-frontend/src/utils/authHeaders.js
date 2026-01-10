// Helper para obtener headers con token de autenticación
export const getAuthHeaders = () => {
  const session = localStorage.getItem('user_session')
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (session) {
    try {
      const data = JSON.parse(session)
      const token = data.session?.access_token || data.access_token || data.token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error parsing session:', error)
    }
  }
  
  return headers
}

// Helper para fetch con autenticación automática
export const authFetch = async (url, options = {}) => {
  const headers = getAuthHeaders()
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  })
}
