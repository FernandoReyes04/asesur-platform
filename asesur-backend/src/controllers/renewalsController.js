// src/controllers/renewalsController.js
const supabase = require('../config/supabase')

const getRenewals = async (req, res) => {
  console.log("⚡ INICIANDO PETICIÓN DE RENOVACIONES...") // Log 1

  const todayStr = new Date().toISOString().split('T')[0]
  
  // 60 días a futuro
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 60)
  const futureStr = futureDate.toISOString().split('T')[0]

  try {
    // 1. CONSULTA SIMPLE Y SEGURA
    console.log("⚡ Consultando Supabase...") // Log 2
    
    const { data, error } = await supabase
      .from('polizas')
      .select('*, clientes ( nombre, apellido, telefono )')
      // No ordenamos aquí para evitar errores si falla la columna en BD

    if (error) {
        console.error("❌ ERROR SUPABASE:", error.message) // Veremos esto si falla la BD
        throw error
    }

    console.log(`✅ Supabase respondió con ${data.length} registros. Procesando...`)

    const result = {
      upcoming: [],
      expired: [],
      cancelled: []
    }

    data.forEach(p => {
        // Fallback por si la fecha es nula
        const finGeneral = p.poliza_fin || todayStr 

        if (p.estado === 'cancelada') {
            result.cancelled.push(p)
        }
        else if (finGeneral < todayStr) {
            result.expired.push(p)
        } 
        else if (finGeneral >= todayStr && finGeneral <= futureStr) {
            result.upcoming.push(p)
        }
    })

    // Ordenamiento manual (JavaScript)
    const sortByDate = (a, b) => new Date(a.poliza_fin) - new Date(b.poliza_fin);
    result.upcoming.sort(sortByDate);
    result.expired.sort(sortByDate);
    result.cancelled.sort(sortByDate);

    console.log("📤 Enviando respuesta al frontend.")
    res.json(result)

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN CONTROLLER:", error.message)
    res.status(400).json({ error: error.message })
  }
}

module.exports = { getRenewals }