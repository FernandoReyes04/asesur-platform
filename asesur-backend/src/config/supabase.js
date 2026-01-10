require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Usamos process.env para leer del archivo .env oculto
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('⚠️ Faltan las variables de entorno de Supabase');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };