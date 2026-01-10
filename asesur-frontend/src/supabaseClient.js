import { createClient } from '@supabase/supabase-js'

// REEMPLAZA ESTO CON TUS DATOS DE SUPABASE (Settings > API)
const supabaseUrl = 'https://djfwsscyhwjqtafvqpzs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZndzc2N5aHdqcXRhZnZxcHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTI2MzcsImV4cCI6MjA4MTY2ODYzN30.IAkKbpyhGiSr1xLWdRkIyNqH06EyxTFgINMMNRskHGY'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // 🔐 ESTO HACE LA MAGIA:
    // sessionStorage = La sesión muere al cerrar la pestaña/navegador.
    // localStorage (default) = La sesión vive para siempre.
    storage: sessionStorage, 
    
    // Configuraciones recomendadas para que funcione fluido
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})