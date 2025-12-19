const supabase = require('../config/supabase')

const login = async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) return res.status(401).json({ error: error.message })
  
  const { data: perfil } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', data.user.id)
    .single()

  res.json({ 
    user: data.user, 
    session: data.session,
    rol: perfil?.rol || 'empleado',
    nombre: perfil?.nombre
  })
}

const register = async (req, res) => {
  const { email, password, nombre, rol } = req.body
  
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return res.status(400).json({ error: error.message })

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email, nombre, rol }])
    
    if (profileError) return res.status(400).json({ error: profileError.message })
  }

  res.json({ message: 'Usuario registrado', user: data.user })
}

module.exports = { login, register }