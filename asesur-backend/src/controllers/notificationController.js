const supabase = require('../config/supabase')
const nodemailer = require('nodemailer')
const cron = require('node-cron')

// 1. CONFIGURACIÓN DEL TRANSPORTE
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// 2. CRON JOB: Ejecución Diaria a la 1:20 PM
const initCronJob = () => {
  console.log('⏰ Sistema de Cobranza Automática: ACTIVO (9:00 AM)')
  
  // Cronómetro: Minuto 0, Hora 9 (9:00 AM) todos los días
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Ejecutando barrido diario de cobranza...')
    await checkAndSendReminders()
  })
}

// LÓGICA DE BARRIDO Y ENVÍO
const checkAndSendReminders = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // ZONA DE PELIGRO: Desde HOY hasta HOY + 15 DÍAS
    // Esto cubre: 15 días antes, 10 días antes, 1 día antes, y el día de hoy.
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() + 15) 
    const limitStr = limitDate.toISOString().split('T')[0]

    // Obtener correo destino
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'email_notificaciones')
      .single()

    if (!config || !config.valor) return console.log('⚠️ No hay correo configurado.')

    // QUERY DE COBRANZA
    const { data: polizas } = await supabase
      .from('polizas')
      .select(`
        numero_poliza, aseguradora, prima_total, fecha_vencimiento_recibo,
        clientes ( nombre, apellido, telefono )
      `)
      .gte('fecha_vencimiento_recibo', today)      // Desde Hoy
      .lte('fecha_vencimiento_recibo', limitStr)   // Hasta dentro de 15 días
      .neq('estado', 'pagado')                     // <--- ESTO ES LA CLAVE: Si ya pagó, se quita. Si debe (pendiente/vencido), se queda.
      .order('fecha_vencimiento_recibo', { ascending: true })

    if (!polizas || polizas.length === 0) {
        return console.log('✅ Todo al día. No hay vencimientos próximos.')
    }

    // Armar HTML
    const htmlTable = `
      <h3 style="color: #b91c1c;">🔔 Reporte Diario de Cobranza</h3>
      <p>Se han detectado <strong>${polizas.length}</strong> pólizas por vencer en los próximos 15 días (o menos):</p>
      
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
        <tr style="background-color: #f8fafc; text-align: left; color: #334155;">
          <th>Días</th><th>Cliente</th><th>Póliza</th><th>Vence</th><th>Monto</th>
        </tr>
        ${polizas.map(p => {
            const diff = new Date(p.fecha_vencimiento_recibo) - new Date()
            const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24))
            
            // Semaforización de Urgencia
            const color = diasRestantes <= 3 ? 'red' : diasRestantes <= 7 ? '#d97706' : '#0f172a';
            const urgencyBg = diasRestantes <= 3 ? '#fee2e2' : 'transparent';

            return `
              <tr style="background-color: ${urgencyBg};">
                <td style="color:${color}; font-weight:bold;">${diasRestantes} días</td>
                <td>${p.clientes.nombre} ${p.clientes.apellido}<br><small style="color:#64748b">${p.clientes.telefono || 'S/T'}</small></td>
                <td>${p.numero_poliza} <br><small>${p.aseguradora}</small></td>
                <td>${p.fecha_vencimiento_recibo}</td>
                <td style="font-weight:bold;">$${p.prima_total}</td>
              </tr>
            `
        }).join('')}
      </table>
      <p style="color:#64748b; font-size:12px; margin-top:20px;">
        Este reporte muestra todas las pólizas con estatus <strong>PENDIENTE</strong> o <strong>VENCIDO</strong> dentro del rango de alerta.
        Las pólizas pagadas se excluyen automáticamente.
      </p>
    `

    // Enviar
    await transporter.sendMail({
      from: '"Asesur Cobranza" <tu_correo_gmail@gmail.com>',
      to: config.valor,
      subject: `🚨 ${polizas.length} Pólizas por Vencer (Reporte Diario)`,
      html: htmlTable
    })
    
    console.log(`📧 Reporte enviado a ${config.valor} con ${polizas.length} alertas.`)

  } catch (error) {
    console.error('❌ Error enviando correo:', error)
  }
}

// 3. ENDPOINTS PARA EL FRONTEND
const getNotificationData = async (req, res) => {
  try {
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor').eq('clave', 'email_notificaciones').single()
    
    const today = new Date().toISOString().split('T')[0]
    
    // Monitor del Frontend (Misma lógica visual)
    const { data: upcoming } = await supabase
      .from('polizas')
      .select('*, clientes(nombre, apellido)')
      .gte('fecha_vencimiento_recibo', today)
      .neq('estado', 'pagado') // Aquí también ocultamos las pagadas
      .order('fecha_vencimiento_recibo', { ascending: true })
      .limit(20)

    res.json({ email: config?.valor || '', upcoming })
  } catch (error) { res.status(500).json({ error: error.message }) }
}

const updateNotificationEmail = async (req, res) => {
  const { newEmail } = req.body
  try {
    const { error } = await supabase
      .from('configuracion')
      .update({ valor: newEmail })
      .eq('clave', 'email_notificaciones')

    if (error) throw error
    res.json({ message: 'Correo actualizado con éxito.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { initCronJob, getNotificationData, updateNotificationEmail }