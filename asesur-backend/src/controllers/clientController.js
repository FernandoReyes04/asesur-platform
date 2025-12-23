const supabase = require('../config/supabase')

// --- CREAR CLIENTE ---
const createClient = async (req, res) => {
  // 1. Recibimos TODOS los campos (incluyendo el nuevo 'telefono')
  const { 
    nombre, apellido, fecha_nacimiento, ine_url, agente_id, 
    direccion, colonia, estado_direccion, municipio, rfc, tipo_persona,
    telefono // <--- 1. NUEVO CAMPO
  } = req.body

  // --- VALIDACIÓN DE SEGURIDAD ---
  // 1. Evitar datos vacíos (Validamos lo esencial)
  if (!nombre || !apellido || !ine_url) {
    return res.status(400).json({ error: 'Datos incompletos o maliciosos' })
  }

  // 2. Sanitización básica
  // Si alguien intenta meter scripts HTML, los bloqueamos.
  if (nombre.includes('<script>') || apellido.includes('<script>')) {
      return res.status(400).json({ error: 'Carácteres no permitidos detectados 🛡️' })
  }

  // 3. Insertar en la BD
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ 
      nombre, apellido, fecha_nacimiento, ine_url, agente_id, 
      direccion, colonia, estado_direccion, municipio, rfc, tipo_persona,
      telefono, // <--- 2. SE GUARDA AQUÍ
      estado: 'pendiente' // Estado inicial del trámite
    }])

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Cliente registrado', data })
}

// --- ACTUALIZAR CLIENTE ---
const updateClient = async (req, res) => {
  const { id } = req.params
  // 1. Recibimos TODOS los campos para editar
  const { 
    nombre, apellido, fecha_nacimiento, ine_url, 
    direccion, colonia, estado_direccion, municipio, rfc, tipo_persona,
    telefono // <--- 3. RECIBIMOS EL TELÉFONO EDITADO
  } = req.body

  const { data, error } = await supabase
    .from('clientes')
    .update({ 
      nombre, apellido, fecha_nacimiento, ine_url,
      direccion, colonia, estado_direccion, municipio, rfc, tipo_persona,
      telefono // <--- 4. ACTUALIZAMOS EL TELÉFONO
    })
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Cliente actualizado', data })
}

// --- BUSCAR CLIENTES ---
const searchClients = async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    // Busca por Nombre, Apellido O RFC
    .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,rfc.ilike.%${q}%`) 
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

module.exports = { createClient, searchClients, updateClient }