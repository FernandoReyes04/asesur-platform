// UBICACIÓN: asesur-backend/src/services/emailScheduler.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { supabase } = require('../config/supabase');

let currentTask = null; // Variable para controlar la tarea cron activa

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// --- HELPER: GENERADOR DE TABLAS HTML ---
// Esta función convierte los datos en HTML visual
const generateSectionHtml = (title, policies, dateField) => {
    if (!policies || policies.length === 0) return '';

    const rows = policies.map(p => {
        // Formato de moneda
        const monto = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p.prima_total || 0);
        // Fecha
        const fecha = p[dateField]; 

        return `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; font-size: 13px;">${p.clientes?.nombre} ${p.clientes?.apellido}</td>
            <td style="padding: 8px; font-size: 13px;">
                <strong>${p.numero_poliza}</strong><br/>
                <span style="color:#666; font-size:11px;">${p.aseguradora}</span>
            </td>
            <td style="padding: 8px; font-size: 13px;">${p.clientes?.telefono || '-'}</td>
            <td style="padding: 8px; font-size: 13px;">${monto}</td>
            <td style="padding: 8px; font-size: 13px; font-weight:bold; color: #c2410c;">${fecha}</td>
        </tr>
        `;
    }).join('');

    return `
        <h3 style="color: #003786; margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #ddd; padding-bottom: 5px;">${title}</h3>
        <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; background-color: #fff; border: 1px solid #e2e8f0;">
            <thead style="background-color:#f8fafc; color:#334155; text-align:left;">
                <tr>
                    <th style="padding:10px; font-size: 12px; text-transform: uppercase;">Cliente</th>
                    <th style="padding:10px; font-size: 12px; text-transform: uppercase;">Póliza</th>
                    <th style="padding:10px; font-size: 12px; text-transform: uppercase;">Teléfono</th>
                    <th style="padding:10px; font-size: 12px; text-transform: uppercase;">Monto</th>
                    <th style="padding:10px; font-size: 12px; text-transform: uppercase;">Vence</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
};

// --- FUNCIÓN PRINCIPAL: REPORTE DIARIO (LÓGICA REAL) ---
const sendDailyReport = async () => {
    console.log("Iniciando generación de reporte diario...");
    
    try {
        // 1. Obtener correo destino de la BD
        const { data: config } = await supabase.from('configuracion').select('valor').eq('clave', 'email_notificaciones').single();
        
        if (!config || !config.valor) {
            console.log("No se envió reporte: No hay correo configurado.");
            return;
        }
        const emailDestino = config.valor;

        // 2. Definir fechas (Próximos 15 días)
        const today = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + 15);
        
        const todayStr = today.toISOString().split('T')[0];
        const limitStr = limit.toISOString().split('T')[0];

        // 3. CONSULTA REAL A SUPABASE: Recibos por Pagar
        const { data: recibos } = await supabase
            .from('polizas')
            .select('*, clientes(nombre, apellido, telefono)')
            .gte('recibo_fin', todayStr)
            .lte('recibo_fin', limitStr)
            .neq('estado', 'pagado')
            .neq('estado', 'cancelada')
            .order('recibo_fin', { ascending: true });

        // 4. CONSULTA REAL A SUPABASE: Renovaciones
        const { data: renovaciones } = await supabase
            .from('polizas')
            .select('*, clientes(nombre, apellido, telefono)')
            .gte('poliza_fin', todayStr)
            .lte('poliza_fin', limitStr)
            .neq('estado', 'cancelada')
            .order('poliza_fin', { ascending: true });

        // Si no hay nada urgente, no enviamos nada
        if ((!recibos || recibos.length === 0) && (!renovaciones || renovaciones.length === 0)) {
            console.log("Reporte diario omitido: No hay vencimientos próximos.");
            return;
        }

        // 5. Construir HTML con los datos obtenidos
        const htmlRecibos = generateSectionHtml('Recibos Pendientes de Pago (Próx. 15 días)', recibos, 'recibo_fin');
        const htmlRenovaciones = generateSectionHtml('Renovaciones de Contrato (Próx. 15 días)', renovaciones, 'poliza_fin');

        const finalHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #003786; text-align: center;">Resumen Operativo Asesur</h2>
                <p style="text-align: center; color: #64748b;">Alertas para los próximos 15 días (${todayStr} al ${limitStr})</p>
                
                ${htmlRecibos || '<p style="color:#166534; background:#dcfce7; padding:10px; border-radius:4px; text-align:center;">✅ Al día con los recibos.</p>'}
                
                ${htmlRenovaciones || '<p style="color:#166534; background:#dcfce7; padding:10px; border-radius:4px; text-align:center;">✅ Sin renovaciones próximas.</p>'}
                
                <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #999;">
                    Enviado automáticamente por el Sistema de Gestión Asesur.
                </div>
            </div>
        `;

        // 6. Enviar Correo
        await transporter.sendMail({
            from: `"Notificaciones Asesur" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: ` Alerta Diaria: ${recibos?.length || 0} Cobros / ${renovaciones?.length || 0} Renovaciones`,
            html: finalHtml
        });

        console.log(`Reporte diario enviado exitosamente a: ${emailDestino}`);

    } catch (error) {
        console.error("Error crítico generando reporte diario:", error);
    }
};

// --- CORREO DE VERIFICACIÓN (Se dispara al guardar configuración) ---
const sendVerificationEmail = async (email, time) => {
    try {
        await transporter.sendMail({
            from: `"Sistema Asesur" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `✅ Verificación de Notificaciones - Grupo Asesur`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #003786;">Configuración Exitosa</h2>
                    <p>Este correo confirma que has configurado correctamente las notificaciones automáticas.</p>
                    <ul style="background-color: #f8fafc; padding: 15px; border-radius: 6px; list-style: none;">
                        <li><strong>Destinatario:</strong> ${email}</li>
                        <li><strong>Hora programada:</strong> ${time} hrs (Diariamente)</li>
                    </ul>
                    <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">Sistema de Gestión Asesur</p>
                </div>
            `
        });
        console.log(`Verificación enviada a ${email}`);
    } catch (error) {
        console.error("Error enviando verificación:", error);
    }
}

// --- INICIADOR DEL SCHEDULER (Gestión del Cron) ---
const initScheduler = async () => {
    try {
        const { data: configHora } = await supabase.from('configuracion').select('valor').eq('clave', 'hora_notificaciones').single();
        const time = configHora ? configHora.valor : '09:00';
        const [hh, mm] = time.split(':'); 

        if (currentTask) currentTask.stop();

        console.log(` Sistema de Notificaciones ACTIVADO: Programado a las ${time} hrs`);
        
        currentTask = cron.schedule(`${mm} ${hh} * * *`, () => {
            sendDailyReport();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

    } catch (error) {
        console.error("❌ Error iniciando el scheduler:", error);
    }
};

module.exports = { initScheduler, sendVerificationEmail };