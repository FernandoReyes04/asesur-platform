const supabase = require('../config/supabase')

const createPolicy = async (req, res) => {
  const { 
    cliente_id, numero_poliza, numero_recibo, fecha_vencimiento_recibo,
    recibo_inicio, recibo_fin, forma_pago, prima_neta, prima_total, aseguradora
  } = req.body

  // Validación simple
  if (!cliente_id || !numero_poliza) {
    return res.status(400).json({ error: 'Falta el cliente o el número de póliza' })
  }

  const { data, error } = await supabase
    .from('polizas')
    .insert([{
      cliente_id,
      numero_poliza,
      numero_recibo,
      fecha_vencimiento_recibo,
      recibo_inicio,
      recibo_fin,
      forma_pago,
      prima_neta,
      prima_total,
      aseguradora
    }])

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Póliza registrada exitosamente', data })
}

// Obtener pólizas de un cliente específico
const getPoliciesByClient = async (req, res) => {
  const { cliente_id } = req.params
  const { data, error } = await supabase
    .from('polizas')
    .select('*')
    .eq('cliente_id', cliente_id)
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}
// NUEVA FUNCIÓN: ACTUALIZAR PÓLIZA
const updatePolicy = async (req, res) => {
  const { id } = req.params // ID de la póliza
  const updates = req.body  // Los datos nuevos (recibo, fechas, montos...)

  const { data, error } = await supabase
    .from('polizas')
    .update(updates)
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Póliza actualizada correctamente', data })
}

module.exports = { createPolicy, getPoliciesByClient, updatePolicy } // <--- No olvides exportarla
