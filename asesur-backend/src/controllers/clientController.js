const supabase = require('../config/supabase')

// --- CREAR CLIENTE ---
const createClient = async (req, res) => {
  // 1. Recibimos TODOS los campos nuevos
  const { 
    nombre, apellido, fecha_nacimiento, ine_url, agente_id, 
    direccion, colonia, estado_direccion, municipio, rfc, tipo_persona 
  } = req.body

  // --- VALIDACIÓN DE SEGURIDAD ---
  // 1. Evitar datos vacíos
  if (!nombre || !apellido || !ine_url) {
    return res.status(400).json({ error: 'Datos incompletos o maliciosos' })
  }

  // 2. Sanitización básica (Ejemplo manual)
  // Si alguien intenta meter scripts HTML, los bloqueamos o limpiamos.
  if (nombre.includes('<script>') || apellido.includes('<script>')) {
     return res.status(400).json({ error: 'Carácteres no permitidos detectados 🛡️' })
  }
ok
  // 2. Los insertamos en la BD
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ 
      nombre, apellido, fecha_nacimiento, ine_url, agente_id, 
      direccion, colonia, estado_direccion, municipio, rfc, tipo_persona,
      estado: 'pendiente' // Estado del trámite
    }])

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Cliente registrado', data })
}

// --- ACTUALIZAR CLIENTE ---
const updateClient = async (req, res) => {
  const { id } = req.params
  // 1. Recibimos TODOS los campos también aquí
  const { 
    nombre, apellido, fecha_nacimiento, ine_url, 
    direccion, colonia, estado_direccion, municipio, rfc, tipo_persona 
  } = req.body

  const { data, error } = await supabase
    .from('clientes')
    .update({ 
      nombre, apellido, fecha_nacimiento, ine_url,
      direccion, colonia, estado_direccion, municipio, rfc, tipo_persona 
    })
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Cliente actualizado', data })
}

// (La función de searchClients se queda igual)
const searchClients = async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,rfc.ilike.%${q}%`) // Agregué búsqueda por RFC también ;)
    .limit(10)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

module.exports = { createClient, searchClients, updateClient }