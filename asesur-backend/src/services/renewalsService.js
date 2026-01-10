const { supabase } = require('../config/supabase');

class RenewalsService {

  async getRenewalsStatus() {
    console.log("⚡ [Service] Consultando renovaciones directo en DB...");

    // 1. Definir fechas límite
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Futuro: 60 días
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const futureStr = futureDate.toISOString().split('T')[0];

    // Pasado: Límite para "Vencidas" (Ej: 3 meses atrás). 
    // OPTIMIZACIÓN: No traemos vencidas de hace 5 años, solo las recientes recuperables.
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 3);
    const pastStr = pastDate.toISOString().split('T')[0];

    // 2. Ejecutar 3 consultas en paralelo (Más rápido que una gigante)
    const [upcomingRes, expiredRes, cancelledRes] = await Promise.all([
        
        // A. PRÓXIMAS (Vigentes que vencen pronto)
        supabase
            .from('polizas')
            .select('*, clientes ( nombre, apellido, telefono )')
            .neq('estado', 'cancelada')       // Que no estén canceladas
            .gte('poliza_fin', todayStr)      // Fin mayor o igual a hoy
            .lte('poliza_fin', futureStr)     // Fin menor a 60 días
            .order('poliza_fin', { ascending: true }),

        // B. VENCIDAS (Recientemente)
        supabase
            .from('polizas')
            .select('*, clientes ( nombre, apellido, telefono )')
            .neq('estado', 'cancelada')       // Que no estén canceladas
            .lt('poliza_fin', todayStr)       // Fin menor a hoy
            .gte('poliza_fin', pastStr)       // Pero no más viejas de 3 meses (Optimization)
            .order('poliza_fin', { ascending: false }), // Las más recientes primero

        // C. CANCELADAS (Recientes)
        supabase
            .from('polizas')
            .select('*, clientes ( nombre, apellido, telefono )')
            .eq('estado', 'cancelada')
            .gte('poliza_fin', pastStr)       // Solo canceladas recientes (opcional)
            .order('poliza_fin', { ascending: false })
    ]);

    // 3. Verificar Errores
    if (upcomingRes.error) throw new Error(`Error Próximas: ${upcomingRes.error.message}`);
    if (expiredRes.error) throw new Error(`Error Vencidas: ${expiredRes.error.message}`);
    if (cancelledRes.error) throw new Error(`Error Canceladas: ${cancelledRes.error.message}`);

    console.log(`✅ [Service] DB Respondió: ${upcomingRes.data.length} próximas, ${expiredRes.data.length} vencidas.`);

    // 4. Retornar estructura limpia
    return {
      upcoming: upcomingRes.data || [],
      expired: expiredRes.data || [],
      cancelled: cancelledRes.data || []
    };
  }
}

module.exports = new RenewalsService();