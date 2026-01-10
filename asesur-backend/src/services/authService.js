const { supabase } = require('../config/supabase');

class AuthService {

  async loginUser(email, password) {
    // 1. Intentar Logueo en Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Lanzamos un error con status específico para que el ErrorHandler sepa qué hacer
      const err = new Error(error.message);
      err.status = 401; // Unauthorized
      throw err;
    }

    // 2. Obtener datos extra del perfil (Rol, Nombre)
    // Nota: Usamos maybeSingle() por si el perfil no existe aún, que no rompa todo.
    const { data: perfil, error: profileError } = await supabase
      .from('profiles')
      .select('rol, nombre')
      .eq('id', data.user.id)
      .maybeSingle(); 

    if (profileError) {
        console.warn("⚠️ Usuario logueado pero sin perfil en BD:", profileError.message);
    }

    // 3. Retornar objeto limpio
    return {
      user: data.user,
      session: data.session,
      rol: perfil?.rol || 'empleado', // Fallback por seguridad
      nombre: perfil?.nombre || data.user.email // Fallback visual
    };
  }

  async registerUser(email, password, nombre, rol) {
    // 1. Crear usuario en Supabase Auth con metadata
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          nombre: nombre,
          rol: rol || 'empleado'
        }
      }
    });

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // 2. NO insertamos en profiles - Supabase lo hace automáticamente con un trigger
    // La tabla profiles se llena automáticamente cuando se crea un usuario en Auth
    
    return { 
        message: 'Usuario registrado correctamente', 
        user: data.user 
    };
  }
}

module.exports = new AuthService();