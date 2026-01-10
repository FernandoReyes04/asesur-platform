const { supabase } = require('../config/supabase');
// Asegúrate de que estas funciones existan y se exporten correctamente en emailScheduler.js
const { initScheduler, sendVerificationEmail } = require('./emailScheduler');

class ConfigService {

  // Obtener la configuración actual
  async getNotificationSettings() {
    const { data, error } = await supabase
        .from('configuracion')
        .select('clave, valor')
        .in('clave', ['email_notificaciones', 'hora_notificaciones']);
    
    if (error) throw new Error(`Error BD: ${error.message}`);

    const config = {};
    // Verificamos que data exista para evitar errores
    if (data) {
        data.forEach(item => {
            if (item.clave === 'email_notificaciones') config.email = item.valor;
            if (item.clave === 'hora_notificaciones') config.time = item.valor;
        });
    }

    return config;
  }

  // Actualizar configuración
  async updateNotificationSettings(email, time) {
    // 1. Guardar en BD (CORRECCIÓN: onConflict)
    const { error } = await supabase.from('configuracion').upsert([
        { clave: 'email_notificaciones', valor: email },
        { clave: 'hora_notificaciones', valor: time }
    ], { onConflict: 'clave' }); // <--- ¡ESTO ARREGLA EL ERROR DE DUPLICADOS!

    if (error) throw new Error(`Error al guardar configuración: ${error.message}`);

    // 2. Efectos secundarios (Reiniciar proceso y enviar correo)
    try {
        // Ejecutamos solo si las funciones fueron importadas correctamente
        if (initScheduler) await initScheduler(); 
        if (sendVerificationEmail) await sendVerificationEmail(email, time);
    } catch (schedulerError) {
        // Es mejor hacer un console.error pero NO romper la petición, 
        // porque los datos YA se guardaron en la BD.
        console.error("⚠️ Datos guardados, pero falló el sistema de correos:", schedulerError.message);
        
        // Retornamos con una advertencia
        return { 
            message: "Configuración guardada, pero hubo un problema enviando el correo de prueba.",
            warning: schedulerError.message 
        };
    }

    return { message: "Configuración actualizada y sistema reiniciado correctamente" };
  }
}

module.exports = new ConfigService();