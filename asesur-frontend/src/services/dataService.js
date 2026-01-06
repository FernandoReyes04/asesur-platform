const API_URL = '/api'

export const dataService = {
  async getDashboardData() {
    const response = await fetch(`${API_URL}/dashboard`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }
}