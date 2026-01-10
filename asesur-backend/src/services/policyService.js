const { supabase } = require('../config/supabase');

class PolicyService {

  // --- LÓGICA PRIVADA: AUTOMATIZACIÓN DE ESTADOS ---
  // Este método se llama internamente antes de leer datos
  async _enforcePolicyStatuses() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Marcar VENCIDO (Si pasó fecha fin y no está pagado/cancelado)
    const { error: errorVencido } = await supabase
      .from('polizas')
      .update({ estado: 'vencido' })
      .lt('recibo_fin', today) 
      .neq('estado', 'pagado')
      .neq('estado', 'cancelada'); // Importante no revivir canceladas

    // 2. Marcar PENDIENTE (Si estamos en vigencia y no está pagado/cancelado/vencido)
    // Esto corrige si alguien extendió la fecha de un vencido manualmente
    const { error: errorPendiente } = await supabase
      .from('polizas')
      .update({ estado: 'pendiente' })
      .gte('recibo_fin', today) 
      .neq('estado', 'pagado')
      .neq('estado', 'cancelada')
      .neq('estado', 'vencido');

    if (errorVencido || errorPendiente) {
        console.error("⚠️ Error actualizando estados automáticos:", errorVencido?.message || errorPendiente?.message);
    }
  }

  // --- MÉTODOS PÚBLICOS ---

  async getAllPolicies() {
    // Primero aseguramos que los estados estén al día
    await this._enforcePolicyStatuses();

    const { data, error } = await supabase
      .from('polizas')
      .select(`*, clientes ( nombre, apellido, telefono )`)
      .order('recibo_fin', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async getPoliciesByClientId(clienteId) {
    await this._enforcePolicyStatuses();

    const { data, error } = await supabase
        .from('polizas')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('recibo_fin', { ascending: true }); // Agregué orden también aquí
    
    if (error) throw new Error(error.message);
    return data;
  }

  async createPolicy(policyData) {
    // Asignamos estado por defecto si no viene
    const newPolicy = {
        ...policyData,
        estado: policyData.estado || 'pendiente'
    };

    const { data, error } = await supabase
      .from('polizas')
      .insert([newPolicy])
      .select();

    if (error) throw new Error(error.message);
    return data[0]; // Retornamos el objeto creado
  }

  async updatePolicy(id, updates) {
    const { data, error } = await supabase
        .from('polizas')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);
    return data[0];
  }
  // Eliminar una póliza por ID
    async deletePolicy(id) {
        const { error } = await supabase
            .from('polizas')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error al eliminar póliza: ${error.message}`);
        }

        return { message: "Póliza eliminada correctamente" };
    }

  // Método unificado para cambios de estado rápidos
  async changeStatus(id, newStatus) {
    const { data, error } = await supabase
        .from('polizas')
        .update({ estado: newStatus })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);
    return { message: `Póliza marcada como ${newStatus}`, data: data[0] };
  }
}

module.exports = new PolicyService();