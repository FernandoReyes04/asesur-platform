const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const verifyToken = async (req, res, next) => {
  // 0. PERMITIR solicitudes OPTIONS (preflight CORS) sin autenticación
  if (req.method === 'OPTIONS') {
    return next();
  }

  // 1. Obtener el token del header (Bearer TOKEN)
  const authHeader = req.headers['authorization'];
  
  // Si no hay header o no empieza con Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Acceso denegado: Token no proporcionado o formato incorrecto' });
  }

  // Extraer el token puro
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado: Token vacío' });
  }

  try {
    // 2. Intentar verificar con Supabase primero (más común)
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (user && !error) {
      // Token válido de Supabase
      req.user = {
        id: user.id,
        email: user.email,
        ...user
      };
      return next();
    }
    
    // 3. Si falla Supabase, intentar con JWT custom (fallback)
    const secret = process.env.JWT_SECRET || 'tu_secreto_super_seguro_dev';
    const verified = jwt.verify(token, secret);
    req.user = verified;
    next();
    
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// 🔥 ESTA ES LA CLAVE: Exportamos la función directamente
module.exports = verifyToken;