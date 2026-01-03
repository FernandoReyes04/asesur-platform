const supabase = require('../config/supabase')
const nodemailer = require('nodemailer')
const cron = require('node-cron')

// 1. CONFIGURACIÓN DEL TRANSPORTE DE CORREO
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// 2. CRON JOB: Ejecución Diaria a las 9:00 AM
const initCronJob = () => {
  console.log('⏰ Sistema de Cobranza Automática: ACTIVO (9:00 AM)')
  
  // Cronómetro: Minuto 0, Hora 9 (9:00 AM) todos los días
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Ejecutando barrido diario de cobranza...')
    await checkAndSendReminders()
  })
}

// LÓGICA DE BARRIDO Y ENVÍO POR CORREO
const checkAndSendReminders = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // ZONA DE ALERTA: Desde HOY hasta HOY + 15 DÍAS
    // Usamos 'recibo_inicio' como la fecha de cobro.
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() + 15) 
    const limitStr = limitDate.toISOString().split('T')[0]

    // A. Obtener correo destino configurado en BD
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'email_notificaciones')
      .single()

    if (!config || !config.valor) return console.log('⚠️ No hay correo configurado para reportes.')

    // B. QUERY DE COBRANZA (Usando recibo_inicio)
    // Buscamos recibos que inician (se deben pagar) entre hoy y 15 días, o que ya vencieron.
    const { data: polizas } = await supabase
      .from('polizas')
      .select(`
        numero_poliza, aseguradora, prima_total, recibo_inicio,
        clientes ( nombre, apellido, telefono )
      `)
      .lte('recibo_inicio', limitStr)    // Que inicie antes del límite (incluye vencidos antiguos)
      .neq('estado', 'pagado')           // Solo si NO está pagado
      .order('recibo_inicio', { ascending: true })

    // Filtramos en memoria para quitar los futuros lejanos si la query trajo de más,
    // o para asegurar que solo enviamos lo relevante.
    // Nota: La query .lte ya filtra el futuro lejano.
    
    if (!polizas || polizas.length === 0) {
        return console.log('✅ Todo al día. No hay cobros pendientes urgentes.')
    }

    // C. Armar HTML del Correo
    const htmlTable = `
      <h3 style="color: #b91c1c;">🔔 Reporte Diario de Cobranza</h3>
      <p>Se han detectado <strong>${polizas.length}</strong> recibos pendientes de pago (próximos o vencidos):</p>
      
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: sans-serif;">
        <tr style="background-color: #f8fafc; text-align: left; color: #334155;">
          <th>Estado/Días</th><th>Cliente</th><th>Póliza</th><th>Inicio Recibo</th><th>Monto</th>
        </tr>
        ${polizas.map(p => {
            const diff = new Date(p.recibo_inicio) - new Date()
            const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24))
            
            // Lógica de Semáforo
            let color = '#0f172a';
            let bgColor = 'transparent';
            let label = `${diasRestantes} días`;

            if (diasRestantes < 0) {
                color = '#ef4444'; // Rojo fuerte
                bgColor = '#fee2e2';
                label = `VENCIDO (${Math.abs(diasRestantes)} días)`;
            } else if (diasRestantes <= 3) {
                color = '#d97706'; // Naranja
                bgColor = '#fff7ed';
                label = `URGENTE (${diasRestantes} días)`;
            }

            return `
              <tr style="background-color: ${bgColor};">
                <td style="color:${color}; font-weight:bold; font-size:12px;">${label}</td>
                <td>
                    <strong>${p.clientes.nombre} ${p.clientes.apellido}</strong><br>
                    <small style="color:#64748b">${p.clientes.telefono || 'S/T'}</small>
                </td>
                <td>${p.numero_poliza} <br><small>${p.aseguradora}</small></td>
                <td>${p.recibo_inicio}</td>
                <td style="font-weight:bold;">$${p.prima_total}</td>
              </tr>
            `
        }).join('')}
      </table>
      <p style="color:#64748b; font-size:12px; margin-top:20px;">
        Este reporte se genera automáticamente basado en la fecha de "Inicio de Recibo".
      </p>
    `

    // D. Enviar Correo
    await transporter.sendMail({
      from: '"Asesur Cobranza" <tu_correo_gmail@gmail.com>',
      to: config.valor,
      subject: `🚨 ${polizas.length} Recibos Pendientes (Reporte Diario)`,
      html: htmlTable
    })
    
    console.log(`📧 Reporte enviado a ${config.valor} con ${polizas.length} alertas.`)

  } catch (error) {
    console.error('❌ Error enviando correo:', error)
  }
}

// 3. ENDPOINTS PARA EL FRONTEND (Vista de Notificaciones)
// Esto alimenta la pantalla "Recibos" en el Dashboard
const getNotificationData = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Configuración de correo actual
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor').eq('clave', 'email_notificaciones').single()
    
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() + 15)
    const limitStr = limitDate.toISOString().split('T')[0]

    // A. PRÓXIMOS (Upcoming): Entre hoy y 15 días
    const { data: upcoming, error: errorUp } = await supabase
      .from('polizas')
      .select('id, numero_poliza, aseguradora, recibo_inicio, prima_total, clientes(nombre, apellido, telefono)')
      .gte('recibo_inicio', today)
      .lte('recibo_inicio', limitStr)
      .neq('estado', 'pagado')
      .order('recibo_inicio', { ascending: true })

    if (errorUp) throw errorUp

    // B. VENCIDOS (Overdue): Fecha menor a hoy
    const { data: overdue, error: errorOver } = await supabase
      .from('polizas')
      .select('id, numero_poliza, aseguradora, recibo_inicio, prima_total, clientes(nombre, apellido, telefono)')
      .lt('recibo_inicio', today)
      .neq('estado', 'pagado')
      .order('recibo_inicio', { ascending: true })

    if (errorOver) throw errorOver

    // Estructura de respuesta para NotificationsView.jsx
    res.json({ 
        email: config?.valor || '', 
        upcoming: upcoming || [],
        overdue: overdue || []
    })

  } catch (error) { 
      console.error("Error obteniendo notificaciones:", error)
      res.status(500).json({ error: error.message }) 
  }
}

// Actualizar correo de destino desde el Frontend
const updateNotificationEmail = async (req, res) => {
  const { newEmail } = req.body
  try {
    // Upsert asegura que si no existe la clave, la crea
    const { error } = await supabase
      .from('configuracion')
      .upsert({ clave: 'email_notificaciones', valor: newEmail }, { onConflict: 'clave' })

    if (error) throw error
    res.json({ message: 'Correo actualizado con éxito.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// CAMBIO EN EL ROUTER:
// Asegúrate de que en tu archivo de rutas (routes.js o index.js) tengas esto conectado:
// router.get('/notificaciones', notificationController.getNotificationData)

module.exports = { initCronJob, getNotificationData, updateNotificationEmail }