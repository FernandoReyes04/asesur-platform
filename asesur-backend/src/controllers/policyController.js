const supabase = require('../config/supabase')

// --- HELPER: AUTOMATIZACIÓN DE ESTADOS (Cobranza) ---
const updatePolicyStatuses = async () => {
  const today = new Date().toISOString().split('T')[0] 

  // 1. Marcar VENCIDO: Si ya pasamos la fecha FIN del recibo
  const { error: errorVencido } = await supabase
    .from('polizas')
    .update({ estado: 'vencido' })
    .lt('recibo_fin', today) 
    .neq('estado', 'pagado')
    .neq('estado', 'cancelada') 

  // 2. Marcar PENDIENTE: Si estamos dentro de la vigencia del recibo
  const { error: errorPendiente } = await supabase
    .from('polizas')
    .update({ estado: 'pendiente' })
    .gte('recibo_fin', today) 
    .neq('estado', 'pagado')
    .neq('estado', 'cancelada')
    .neq('estado', 'vencido')

  if (errorVencido || errorPendiente) console.error("Error estados:", errorVencido || errorPendiente)
}

// --- ENDPOINTS ---

const getPolicies = async (req, res) => {
  await updatePolicyStatuses()
  const { data, error } = await supabase
    .from('polizas')
    .select(`*, clientes ( nombre, apellido, telefono )`)
    .order('recibo_fin', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

const getPoliciesByClient = async (req, res) => {
  const { cliente_id } = req.params
  await updatePolicyStatuses()
  const { data, error } = await supabase.from('polizas').select('*').eq('cliente_id', cliente_id)
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

const createPolicy = async (req, res) => {
  const { 
    cliente_id, numero_poliza, numero_recibo,
    poliza_inicio, poliza_fin,      
    recibo_inicio, recibo_fin,      
    forma_pago, prima_neta, prima_total, aseguradora,
    tipo_poliza, vendedor, 
    estado 
  } = req.body

  if (!cliente_id || !numero_poliza) return res.status(400).json({ error: 'Falta datos' })
  
  const { data, error } = await supabase
    .from('polizas')
    .insert([{ 
        cliente_id, numero_poliza, aseguradora, 
        poliza_inicio, poliza_fin, 
        recibo_inicio, recibo_fin,
        prima_total, prima_neta, forma_pago, numero_recibo,
        tipo_poliza, vendedor,
        estado: estado || 'pendiente' 
    }])

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Creado', data })
}

const updatePolicy = async (req, res) => {
    const { id } = req.params
    const { data, error } = await supabase.from('polizas').update(req.body).eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Actualizado', data })
}

const markAsPaid = async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase.from('polizas').update({ estado: 'pagado' }).eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Pagado' })
}

const cancelPolicy = async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase.from('polizas').update({ estado: 'cancelada' }).eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Póliza cancelada correctamente' })
}

module.exports = { 
    getPolicies, getPoliciesByClient, createPolicy, 
    updatePolicy, markAsPaid, cancelPolicy 
}