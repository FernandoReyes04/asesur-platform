// src/config/supabase.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// En un proyecto real, usa process.env.SUPABASE_URL
// Por ahora pegamos las credenciales aquí o usamos las variables de entorno si las configuraste
const supabaseUrl = 'https://djfwsscyhwjqtafvqpzs.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZndzc2N5aHdqcXRhZnZxcHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA5MjYzNywiZXhwIjoyMDgxNjY4NjM3fQ.h2Prdegb5Z-ZcrbCYXy3uYZxyQp_1GeO97AVWDxSo8g'
const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase