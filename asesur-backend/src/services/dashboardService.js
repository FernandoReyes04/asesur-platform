const { supabase } = require('../config/supabase');

class DashboardService {

  async getSummaryData() {
    // Lógica de negocio: Definir qué es "hoy"
    const today = new Date().toISOString().split('T')[0];

    // Ejecutamos las 3 consultas en paralelo para máxima velocidad
    const [clientesHoyResponse, recientesResponse, agentesResponse] = await Promise.all([
      // 1. Clientes con fecha límite hoy
      supabase.from('clientes').select('*').eq('fecha_limite', today),
      
      // 2. Los 5 trámites más recientes
      supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(5),
      
      // 3. Lista de agentes (empleados)
      supabase.from('profiles').select('*').eq('rol', 'empleado')
    ]);

    // VALIDACIÓN ROBUSTA:
    // Supabase no lanza "catch" si hay error de SQL, devuelve un objeto { error }.
    // Aquí verificamos si ALGUNA falló.
    if (clientesHoyResponse.error) throw new Error(`Error al obtener clientes de hoy: ${clientesHoyResponse.error.message}`);
    if (recientesResponse.error) throw new Error(`Error al obtener trámites recientes: ${recientesResponse.error.message}`);
    if (agentesResponse.error) throw new Error(`Error al obtener agentes: ${agentesResponse.error.message}`);

    // Si todo salió bien, retornamos los datos limpios
    return {
      clientesHoy: clientesHoyResponse.data || [],
      ultimosTramites: recientesResponse.data || [],
      agentes: agentesResponse.data || []
    };
  }
}

module.exports = new DashboardService();