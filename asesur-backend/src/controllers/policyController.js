const supabase = require('../config/supabase')

// --- HELPER: LÓGICA DE AUTOMATIZACIÓN DE ESTADOS ---
const updatePolicyStatuses = async () => {
  const today = new Date().toISOString().split('T')[0] 

  // 1. Marcar VENCIDO
  const { error: errorVencido } = await supabase
    .from('polizas')
    .update({ estado: 'vencido' })
    .lt('fecha_vencimiento_recibo', today)
    .neq('estado', 'pagado')

  // 2. Marcar PENDIENTE
  const { error: errorPendiente } = await supabase
    .from('polizas')
    .update({ estado: 'pendiente' })
    .gte('fecha_vencimiento_recibo', today)
    .neq('estado', 'pagado')

  if (errorVencido || errorPendiente) console.error("Error actualizando estados:", errorVencido || errorPendiente)
}

// --- ENDPOINTS ---

// 1. OBTENER TODAS (Actualizado para traer teléfono)
const getPolicies = async (req, res) => {
  await updatePolicyStatuses()

  const { data, error } = await supabase
    .from('polizas')
    .select(`
      *,
      clientes ( nombre, apellido, telefono ) 
    `) // <--- AQUÍ AGREGUÉ 'telefono'
    .order('fecha_vencimiento_recibo', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// 2. POR CLIENTE
const getPoliciesByClient = async (req, res) => {
  const { cliente_id } = req.params
  await updatePolicyStatuses()

  const { data, error } = await supabase
    .from('polizas')
    .select('*')
    .eq('cliente_id', cliente_id)
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// 3. CREAR
const createPolicy = async (req, res) => {
  const { 
    cliente_id, numero_poliza, numero_recibo, fecha_vencimiento_recibo,
    recibo_inicio, recibo_fin, forma_pago, prima_neta, prima_total, aseguradora
  } = req.body

  if (!cliente_id || !numero_poliza) {
    return res.status(400).json({ error: 'Falta datos obligatorios' })
  }
  
  const { data, error } = await supabase
    .from('polizas')
    .insert([{ 
        cliente_id, numero_poliza, aseguradora, 
        recibo_inicio, recibo_fin, fecha_vencimiento_recibo, 
        prima_total, prima_neta, forma_pago, numero_recibo,
        estado: 'pendiente'
    }])

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Póliza creada exitosamente', data })
}

// 4. ACTUALIZAR
const updatePolicy = async (req, res) => {
    const { id } = req.params
    const updates = req.body
    const { data, error } = await supabase
      .from('polizas')
      .update(updates)
      .eq('id', id)
  
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Póliza actualizada', data })
}

// 5. PAGAR
const markAsPaid = async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('polizas')
    .update({ estado: 'pagado' })
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Póliza marcada como PAGADA' })
}

module.exports = { getPolicies, getPoliciesByClient, createPolicy, updatePolicy, markAsPaid }