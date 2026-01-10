const { supabase } = require('../config/supabase');

class RecordsService {

  async searchGlobalRecords(term) {
    const searchTerm = term || '';
    let clientIds = new Set();

    // ESCENARIO A: HAY TÉRMINO DE BÚSQUEDA
    if (searchTerm) {
      // 1. Buscar coincidencia en CLIENTES (Nombre o Apellido)
      const { data: clientsByName, error: errClients } = await supabase
        .from('clientes')
        .select('id')
        .or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%`);
      
      if (errClients) throw new Error(`Error buscando clientes: ${errClients.message}`);
      clientsByName?.forEach(c => clientIds.add(c.id));

      // 2. Buscar coincidencia en PÓLIZAS (Número)
      const { data: policiesByNum, error: errPolicies } = await supabase
        .from('polizas')
        .select('cliente_id')
        .ilike('numero_poliza', `%${searchTerm}%`);
      
      if (errPolicies) throw new Error(`Error buscando pólizas: ${errPolicies.message}`);
      policiesByNum?.forEach(p => clientIds.add(p.cliente_id));

      // Si buscamos algo específico y no encontramos nada en ninguna tabla:
      if (clientIds.size === 0) {
        return []; 
      }
    }

    // ESCENARIO B: CONSULTA MAESTRA (Expedientes)
    let query = supabase
      .from('clientes')
      .select('*, polizas(*)')
      .order('created_at', { ascending: false });

    if (searchTerm && clientIds.size > 0) {
      // Filtramos solo los IDs que encontramos en los pasos 1 y 2
      query = query.in('id', Array.from(clientIds));
    } else {
      // Si no hay búsqueda, mostramos los 10 más recientes
      query = query.limit(10);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo expedientes: ${error.message}`);
    
    return data || [];
  }
}

module.exports = new RecordsService();