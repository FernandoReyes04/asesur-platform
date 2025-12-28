const supabase = require('../config/supabase')

const getMetrics = async (req, res) => {
  try {
    // 1. Traemos TODAS las pólizas (sin filtro de fecha para ver historial completo)
    const { data: policies, error } = await supabase
      .from('polizas')
      .select('id, prima_total, prima_neta, aseguradora, created_at, estado')
    
    if (error) throw error

    console.log(`📊 Procesando ${policies.length} registros para métricas...`)

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // --- HELPERS PARA TARJETAS ---
    const isSameMonth = (d) => d.getMonth() === currentMonth && d.getFullYear() === currentYear
    const isBimester = (d) => {
        const diff = currentMonth - d.getMonth() + (12 * (currentYear - d.getFullYear()))
        return diff >= 0 && diff < 2
    }
    const isInPeriod = (d, months) => {
        const diff = currentMonth - d.getMonth() + (12 * (currentYear - d.getFullYear()))
        return diff >= 0 && diff < months
    }

    // --- ACUMULADORES ---
    let counts = { mes: 0, bimestre: 0, trimestre: 0, cuatrimestre: 0, semestre: 0, anio: 0 }
    let earnings = { total: 0, neta: 0 }
    let byInsurer = {} 
    let byMonth = {}   
    let insurerStats = {}

    // --- PROCESAMIENTO ---
    policies.forEach(p => {
        // A. Validar fecha
        if (!p.created_at) return;
        const insurerName = p.aseguradora || 'Sin Asignar';

        // B. LIMPIEZA DE DINERO (CRÍTICO: Quita signos $ y comas)
        const cleanTotal = String(p.prima_total).replace(/[^0-9.-]+/g, "")
        const cleanNeta = String(p.prima_neta).replace(/[^0-9.-]+/g, "")
        
        const pTotal = parseFloat(cleanTotal) || 0
        const pNeta = parseFloat(cleanNeta) || 0

        const date = new Date(p.created_at)
        // Clave de Mes: "2024-12", "2025-01", etc.
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        // C. Llenar Tarjetas (Solo año actual o recientes)
        if (isSameMonth(date)) counts.mes++
        if (isBimester(date)) counts.bimestre++
        if (isInPeriod(date, 3)) counts.trimestre++
        if (isInPeriod(date, 4)) counts.cuatrimestre++
        if (isInPeriod(date, 6)) counts.semestre++
        if (isInPeriod(date, 12)) counts.anio++

        // D. Sumas Globales
        earnings.total += pTotal
        earnings.neta += pNeta

        // E. Pastel (Share de Mercado)
        if (!byInsurer[insurerName]) byInsurer[insurerName] = 0
        byInsurer[insurerName]++

        // F. Cierre Mensual Global (Agrupa TODO el historial)
        if (!byMonth[monthKey]) byMonth[monthKey] = { mes: monthKey, total: 0, neta: 0, count: 0 }
        byMonth[monthKey].total += pTotal
        byMonth[monthKey].neta += pNeta
        byMonth[monthKey].count++

        // G. Detalle por Aseguradora
        if (!insurerStats[insurerName]) {
            insurerStats[insurerName] = { 
                name: insurerName, 
                totalSales: 0, 
                totalCount: 0, 
                history: {}    
            }
        }
        insurerStats[insurerName].totalSales += pTotal
        insurerStats[insurerName].totalCount++
        
        if (!insurerStats[insurerName].history[monthKey]) insurerStats[insurerName].history[monthKey] = 0
        insurerStats[insurerName].history[monthKey] += pTotal
    })

    // --- RESPUESTA ---
    const insurerData = Object.keys(byInsurer).map(k => ({ name: k, value: byInsurer[k] }))
    // Ordenamos meses cronológicamente (antiguos primero o recientes primero, tú decides. Aquí es cronológico ascendente)
    const monthlyData = Object.values(byMonth).sort((a,b) => a.mes.localeCompare(b.mes))
    
    const insurerDetailed = Object.values(insurerStats).map(ins => {
        const chartData = Object.keys(ins.history).sort().map(m => ({ mes: m, venta: ins.history[m] }))
        return { ...ins, chartData }
    })

    res.json({ counts, earnings, insurerData, monthlyData, insurerDetailed })

  } catch (error) {
    console.error("Error métricas:", error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getMetrics }