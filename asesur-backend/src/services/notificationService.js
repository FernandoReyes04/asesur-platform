const { supabase } = require('../config/supabase');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Configuración del transporte (Privado dentro del servicio)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class NotificationService {

  // --- A. GESTIÓN DEL CRON JOB (Se llama desde server.js) ---
  initDailyScheduler() {
    console.log('⏰ Sistema de Cobranza Automática: ACTIVO (9:00 AM)');
    
    // Cron: Minuto 0, Hora 9, todos los días
    cron.schedule('0 9 * * *', async () => {
      console.log('🔄 Ejecutando barrido diario de cobranza...');
      await this.executeDailyCollectionCheck();
    });
  }

  // --- B. LÓGICA DE BARRIDO Y ENVÍO (Privada o Pública si quieres forzarla manual) ---
  async executeDailyCollectionCheck() {
    const today = new Date().toISOString().split('T')[0];
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 15);
    const limitStr = limitDate.toISOString().split('T')[0];

    // 1. Obtener correo destino
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'email_notificaciones')
      .maybeSingle();

    if (!config || !config.valor) {
        console.log('⚠️ No hay correo configurado. Saltando envío.');
        return;
    }

    // 2. Buscar pólizas pendientes
    const { data: polizas, error } = await supabase
      .from('polizas')
      .select(`numero_poliza, aseguradora, prima_total, recibo_inicio, clientes ( nombre, apellido, telefono )`)
      .lte('recibo_inicio', limitStr)
      .neq('estado', 'pagado')
      .order('recibo_inicio', { ascending: true });

    if (error) throw new Error(`Error en Cron Job: ${error.message}`);
    
    if (!polizas || polizas.length === 0) {
        return console.log('✅ Todo al día. No hay cobros pendientes.');
    }

    // 3. Generar HTML (Podrías mover esto a utils/emailTemplates.js para más limpieza)
    const htmlBody = this._generateCollectionHTML(polizas);

    // 4. Enviar
    try {
        await transporter.sendMail({
            from: '"Asesur Cobranza" <tu_correo@gmail.com>',
            to: config.valor,
            subject: `🚨 ${polizas.length} Recibos Pendientes (Reporte Diario)`,
            html: htmlBody
        });
        console.log(`📧 Reporte enviado a ${config.valor}`);
    } catch (mailError) {
        console.error("❌ Error SMTP:", mailError);
    }
  }

  // --- C. MÉTODOS PARA EL DASHBOARD (HTTP) ---
  
  // Obtener alertas para la campanita/vista
  async getDashboardNotifications() {
    const today = new Date().toISOString().split('T')[0];
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 15);
    const limitStr = limitDate.toISOString().split('T')[0];

    // 1. Configuración email
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor').eq('clave', 'email_notificaciones').maybeSingle();

    // 2. Consultas Paralelas (Próximos y Vencidos)
    const [upcomingResponse, overdueResponse] = await Promise.all([
        supabase.from('polizas')
            .select('id, numero_poliza, aseguradora, recibo_inicio, prima_total, clientes(nombre, apellido, telefono)')
            .gte('recibo_inicio', today)
            .lte('recibo_inicio', limitStr)
            .neq('estado', 'pagado')
            .order('recibo_inicio', { ascending: true }),
        
        supabase.from('polizas')
            .select('id, numero_poliza, aseguradora, recibo_inicio, prima_total, clientes(nombre, apellido, telefono)')
            .lt('recibo_inicio', today)
            .neq('estado', 'pagado')
            .order('recibo_inicio', { ascending: true })
    ]);

    if (upcomingResponse.error) throw new Error(upcomingResponse.error.message);
    if (overdueResponse.error) throw new Error(overdueResponse.error.message);

    return { 
        email: config?.valor || '', 
        upcoming: upcomingResponse.data || [],
        overdue: overdueResponse.data || []
    };
  }

  // Actualizar configuración
  async updateEmailConfig(newEmail) {
    const { error } = await supabase
      .from('configuracion')
      .upsert({ clave: 'email_notificaciones', valor: newEmail }, { onConflict: 'clave' });
    
    if (error) throw new Error(error.message);
    return { message: 'Correo actualizado con éxito.' };
  }

  // Obtener Renovaciones
  async getRenewalsList() {
    const today = new Date().toISOString().split('T')[0];
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 45); // 45 días
    const limitStr = limitDate.toISOString().split('T')[0];
    const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString();

    const [renewalsResponse, expiredResponse] = await Promise.all([
        supabase.from('polizas')
            .select(`id, numero_poliza, aseguradora, poliza_fin, prima_total, clientes(nombre, apellido, telefono)`)
            .gte('poliza_fin', today)
            .lte('poliza_fin', limitStr)
            .order('poliza_fin', { ascending: true }),

        supabase.from('polizas')
            .select(`*`)
            .lt('poliza_fin', today)
            .gt('poliza_fin', twoMonthsAgo)
            .order('poliza_fin', { ascending: false })
    ]);

    if (renewalsResponse.error) throw new Error(renewalsResponse.error.message);
    if (expiredResponse.error) throw new Error(expiredResponse.error.message);

    return { 
        upcoming: renewalsResponse.data || [],
        expired: expiredResponse.data || [] 
    };
  }

  // --- HELPER PRIVADO: Generador de HTML ---
  _generateCollectionHTML(polizas) {
    // Aquí pegas tu lógica de `htmlTable` que tenías antes
    // ... (El string template con el map de polizas)
    return `
      <h3 style="color: #b91c1c;">🔔 Reporte Diario de Cobranza</h3>
      <p>Se han detectado <strong>${polizas.length}</strong> recibos pendientes...</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: sans-serif;">
         <tr style="background-color: #f8fafc;"><th>Estado</th><th>Cliente</th><th>Póliza</th><th>Inicio</th><th>Monto</th></tr>
         ${polizas.map(p => {
             // ... tu lógica de colores ...
             return `<tr><td>...</td><td>${p.clientes.nombre}</td>...</tr>`; // Resumido por brevedad
         }).join('')}
      </table>
    `;
  }
}

module.exports = new NotificationService();