const supabase = require('../config/supabase')

// --- HELPER: LÓGICA DE AUTOMATIZACIÓN DE ESTADOS ---
const updatePolicyStatuses = async () => {
  const today = new Date().toISOString().split('T')[0] 

  // 1. Marcar VENCIDO: Si hoy es después del inicio del recibo y no ha pagado
  const { error: errorVencido } = await supabase
    .from('polizas')
    .update({ estado: 'vencido' })
    .lt('recibo_inicio', today) 
    .neq('estado', 'pagado')

  // 2. Marcar PENDIENTE: Si hoy es antes o igual al inicio del recibo
  const { error: errorPendiente } = await supabase
    .from('polizas')
    .update({ estado: 'pendiente' })
    .gte('recibo_inicio', today)
    .neq('estado', 'pagado')

  if (errorVencido || errorPendiente) console.error("Error estados:", errorVencido || errorPendiente)
}

// --- ENDPOINTS ---

const getPolicies = async (req, res) => {
  await updatePolicyStatuses()
  const { data, error } = await supabase
    .from('polizas')
    .select(`*, clientes ( nombre, apellido, telefono )`)
    .order('recibo_inicio', { ascending: true }) // Ordenar por fecha de cobro

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

// 3. CREAR (NUEVA ESTRUCTURA)
const createPolicy = async (req, res) => {
  const { 
    cliente_id, numero_poliza, numero_recibo,
    poliza_inicio, poliza_fin,      // Vigencia General
    recibo_inicio, recibo_fin,      // Vigencia Recibo
    forma_pago, prima_neta, prima_total, aseguradora
  } = req.body

  if (!cliente_id || !numero_poliza) return res.status(400).json({ error: 'Falta datos' })
  
  const { data, error } = await supabase
    .from('polizas')
    .insert([{ 
        cliente_id, numero_poliza, aseguradora, 
        poliza_inicio, poliza_fin, 
        recibo_inicio, recibo_fin,
        prima_total, prima_neta, forma_pago, numero_recibo,
        estado: 'pendiente'
    }])

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Creado', data })
}

// 4. ACTUALIZAR y 5. PAGAR (Igual que antes)
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

module.exports = { getPolicies, getPoliciesByClient, createPolicy, updatePolicy, markAsPaid }