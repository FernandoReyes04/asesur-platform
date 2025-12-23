const supabase = require('../config/supabase')

const getMetrics = async (req, res) => {
  try {
    // 1. Traemos TODAS las pólizas (para procesarlas aquí, es más rápido que 10 queries SQL)
    const { data: policies, error } = await supabase
      .from('polizas')
      .select('id, prima_total, prima_neta, aseguradora, created_at, estado')
    
    if (error) throw error

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // --- HELPERS DE FILTRADO ---
    const isSameMonth = (d) => d.getMonth() === currentMonth && d.getFullYear() === currentYear
    // Bimestre: Mes actual y el anterior
    const isBimester = (d) => {
        const diff = currentMonth - d.getMonth() + (12 * (currentYear - d.getFullYear()))
        return diff >= 0 && diff < 2
    }
    // Trimestre (3), Cuatrimestre (4), Semestre (6), Año (12)
    const isInPeriod = (d, months) => {
        const diff = currentMonth - d.getMonth() + (12 * (currentYear - d.getFullYear()))
        return diff >= 0 && diff < months
    }

    // --- VARIABLES ACUMULADORAS ---
    let counts = { mes: 0, bimestre: 0, trimestre: 0, cuatrimestre: 0, semestre: 0, anio: 0 }
    let earnings = { total: 0, neta: 0 }
    let byInsurer = {} // { "GNP": 5, "AXA": 2 }
    let byMonth = {}   // { "Enero": {total: 100, neta: 80}, "Febrero": ... }

    // --- PROCESAMIENTO ---
    policies.forEach(p => {
        const date = new Date(p.created_at)
        const pTotal = parseFloat(p.prima_total) || 0
        const pNeta = parseFloat(p.prima_neta) || 0

        // 1. Conteos por periodo
        if (isSameMonth(date)) counts.mes++
        if (isBimester(date)) counts.bimestre++
        if (isInPeriod(date, 3)) counts.trimestre++
        if (isInPeriod(date, 4)) counts.cuatrimestre++
        if (isInPeriod(date, 6)) counts.semestre++
        if (isInPeriod(date, 12)) counts.anio++

        // 2. Ganancias Totales Históricas
        earnings.total += pTotal
        earnings.neta += pNeta

        // 3. Agrupación por Aseguradora (Para gráfica de pastel)
        if (!byInsurer[p.aseguradora]) byInsurer[p.aseguradora] = 0
        byInsurer[p.aseguradora]++

        // 4. Agrupación por Mes (Para gráfica de barras y tabla)
        // Clave ej: "2025-11"
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!byMonth[monthKey]) byMonth[monthKey] = { mes: monthKey, total: 0, neta: 0, count: 0 }
        
        byMonth[monthKey].total += pTotal
        byMonth[monthKey].neta += pNeta
        byMonth[monthKey].count++
    })

    // Formatear para el frontend
    const insurerData = Object.keys(byInsurer).map(k => ({ name: k, value: byInsurer[k] }))
    
    // Ordenar meses cronológicamente
    const monthlyData = Object.values(byMonth).sort((a,b) => a.mes.localeCompare(b.mes))

    res.json({
        counts,
        earnings,
        insurerData,
        monthlyData
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getMetrics }