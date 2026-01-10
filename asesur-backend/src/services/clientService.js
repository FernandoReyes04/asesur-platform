const { supabase } = require('../config/supabase');

class ClientService {

    // Obtener clientes (y sus pólizas asociadas)
    async getAllClients(searchTerm) {
        // 1. Iniciamos la consulta
        let query = supabase
            .from('clientes')
            .select('*, polizas(*)') 
            .order('created_at', { ascending: false });

        // 2. Si hay término de búsqueda, filtramos SOLO por campos de CLIENTE
        if (searchTerm) {
            // Buscamos por nombre, apellido o RFC
            // IMPORTANTE: No incluyas 'numero_poliza' aquí, porque esa columna NO existe en 'clientes'
            // y eso es lo que causa el Error 500.
            query = query.or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,rfc.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error en getAllClients:", error.message);
            throw new Error(`Error obteniendo clientes: ${error.message}`);
        }
        
        return data;
    }

    // Crear cliente
    async createClient(clientData) {
        const { data, error } = await supabase
            .from('clientes')
            .insert([clientData])
            .select();

        if (error) throw new Error(`Error creando cliente: ${error.message}`);
        return data[0];
    }

    // Actualizar cliente
    async updateClient(id, clientData) {
        const { data, error } = await supabase
            .from('clientes')
            .update(clientData)
            .eq('id', id)
            .select();

        if (error) throw new Error(`Error actualizando cliente: ${error.message}`);
        return data[0];
    }
}

module.exports = new ClientService();