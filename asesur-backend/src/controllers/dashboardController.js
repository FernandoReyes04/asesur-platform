const supabase = require('../config/supabase')

const getDashboardData = async (req, res) => {
  const today = new Date().toISOString().split('T')[0]

  try {
    const [clientesHoy, recientes, agentes] = await Promise.all([
      supabase.from('clientes').select('*').eq('fecha_limite', today),
      supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('*').eq('rol', 'empleado')
    ])

    res.json({
      clientesHoy: clientesHoy.data || [],
      ultimosTramites: recientes.data || [],
      agentes: agentes.data || []
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getDashboardData }