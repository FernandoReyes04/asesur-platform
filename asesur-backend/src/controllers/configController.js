const supabase = require('../config/supabase')
const { initScheduler, sendVerificationEmail } = require('../services/emailScheduler');

// GET: Obtener configuración
const getConfig = async (req, res) => {
    const { data, error } = await supabase
        .from('configuracion')
        .select('clave, valor')
        .in('clave', ['email_notificaciones', 'hora_notificaciones'])
    
    if(error) return res.status(400).json({error: error.message})

    const config = {};
    data.forEach(item => {
        if(item.clave === 'email_notificaciones') config.email = item.valor;
        if(item.clave === 'hora_notificaciones') config.time = item.valor;
    });

    res.json(config)
}

// PUT: Actualizar configuración
const updateConfig = async (req, res) => {
    const { email, time } = req.body
    
    if(!email || !time) return res.status(400).json({error: "Faltan datos"})

    try {
        await supabase.from('configuracion').upsert([
            { clave: 'email_notificaciones', valor: email },
            { clave: 'hora_notificaciones', valor: time }
        ]);

        await initScheduler(); 
        await sendVerificationEmail(email, time);

        res.json({ message: "Configuración actualizada" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// EXPORTAR CON LOS NOMBRES NUEVOS
module.exports = { getConfig, updateConfig }