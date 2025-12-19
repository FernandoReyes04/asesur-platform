const supabase = require('../config/supabase')

const searchRecords = async (req, res) => {
  const { q } = req.query
  const term = q || '' // Si está vacío, traemos los recientes

  try {
    let clientIds = new Set()

    // 1. Buscamos CLIENTES que coincidan con el nombre/apellido
    if (term) {
      const { data: clientsByName } = await supabase
        .from('clientes')
        .select('id')
        .or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
      
      clientsByName?.forEach(c => clientIds.add(c.id))

      // 2. Buscamos PÓLIZAS que coincidan con el número
      const { data: policiesByNum } = await supabase
        .from('polizas')
        .select('cliente_id')
        .ilike('numero_poliza', `%${term}%`)
      
      policiesByNum?.forEach(p => clientIds.add(p.cliente_id))
    }

    // 3. Consulta Maestra: Traemos Clientes + Sus Pólizas
    // Si no hay búsqueda (term vacío), traemos los últimos 10
    let query = supabase
      .from('clientes')
      .select('*, polizas(*)') // <--- LA MAGIA: Trae al cliente Y sus pólizas anidadas
      .order('created_at', { ascending: false })

    // Si hubo búsqueda, filtramos por los IDs encontrados
    if (term && clientIds.size > 0) {
      query = query.in('id', Array.from(clientIds))
    } else if (term && clientIds.size === 0) {
      return res.json([]) // Buscó algo pero no encontró nada
    } else {
      query = query.limit(10) // Sin búsqueda, muestra recientes
    }

    const { data, error } = await query

    if (error) throw error
    res.json(data)

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { searchRecords }