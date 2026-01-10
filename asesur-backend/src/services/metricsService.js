// Importamos el cliente de Supabase
// NOTA: Si tu archivo de config exporta el cliente directo, usa esta línea:
const { supabase } = require('../config/supabase');

// --- HELPERS INTERNOS (Para manejo de fechas) ---
const getPeriodHelpers = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
        // Verifica si la fecha es del mes actual
        isSameMonth: (d) => d.getMonth() === currentMonth && d.getFullYear() === currentYear,
        
        // Verifica si está en el bimestre actual (últimos 2 meses)
        isBimester: (d) => {
            const diff = currentMonth - d.getMonth() + (12 * (currentYear - d.getFullYear()));
            return diff >= 0 && diff < 2;
        },
        
        // Verifica si está dentro de un rango de meses (3, 6, 12, etc.)
        isInPeriod: (d, months) => {
            const diff = currentMonth - d.getMonth() + (12 * (currentYear - d.getFullYear()));
            return diff >= 0 && diff < months;
        }
    };
};

// Función para limpiar dinero "$ 1,200.00" -> 1200.00
const cleanCurrency = (val) => {
    if (!val) return 0;
    // Elimina todo lo que no sea número, punto o signo negativo
    const clean = String(val).replace(/[^0-9.-]+/g, "");
    return parseFloat(clean) || 0;
};

class MetricsService {

  // Esta es la función que tu controlador estaba buscando y daba error
  async calculateGeneralMetrics() {
    try {
        // 1. Obtener datos crudos de Supabase (solo las columnas necesarias)
        const { data: policies, error } = await supabase
          .from('polizas')
          .select('id, prima_total, prima_neta, aseguradora, created_at, estado')
          // Opcional: Filtra solo las pagadas si quieres métricas reales
          .eq('estado', 'pagado'); 
        
        if (error) throw new Error(`Error al obtener pólizas para métricas: ${error.message}`);

        console.log(`📊 Procesando ${policies.length} pólizas en MetricsService...`);

        // 2. Inicializar acumuladores
        const { isSameMonth, isBimester, isInPeriod } = getPeriodHelpers();
        
        let counts = { mes: 0, bimestre: 0, trimestre: 0, cuatrimestre: 0, semestre: 0, anio: 0 };
        let earnings = { total: 0, neta: 0 };
        let byInsurer = {}; 
        let byMonth = {};   
        let insurerStats = {};

        // 3. Procesamiento Iterativo (El cerebro matemático)
        policies.forEach(p => {
            if (!p.created_at) return;
            
            const insurerName = p.aseguradora || 'Sin Asignar';
            // Usamos cleanCurrency para asegurar que sumamos números, no textos
            const pTotal = cleanCurrency(p.prima_total);
            const pNeta = cleanCurrency(p.prima_neta);
            const date = new Date(p.created_at);
            
            // Clave de Mes para gráficas: "2024-01"
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // A. Contadores de Tiempo (Tarjetas del Dashboard)
            if (isSameMonth(date)) counts.mes++;
            if (isBimester(date)) counts.bimestre++;
            if (isInPeriod(date, 3)) counts.trimestre++;
            if (isInPeriod(date, 4)) counts.cuatrimestre++;
            if (isInPeriod(date, 6)) counts.semestre++;
            if (isInPeriod(date, 12)) counts.anio++;

            // B. Sumas Globales ($$$)
            earnings.total += pTotal;
            earnings.neta += pNeta;

            // C. Share de Mercado (Gráfica de Pastel)
            if (!byInsurer[insurerName]) byInsurer[insurerName] = 0;
            byInsurer[insurerName]++;

            // D. Historial Mensual Global (Gráfica de Barras General)
            if (!byMonth[monthKey]) byMonth[monthKey] = { mes: monthKey, total: 0, neta: 0, count: 0 };
            byMonth[monthKey].total += pTotal;
            byMonth[monthKey].neta += pNeta;
            byMonth[monthKey].count++;

            // E. Detalle por Aseguradora (Tabla Avanzada)
            if (!insurerStats[insurerName]) {
                insurerStats[insurerName] = { 
                    name: insurerName, 
                    totalSales: 0, 
                    totalCount: 0, 
                    history: {}    
                };
            }
            insurerStats[insurerName].totalSales += pTotal;
            insurerStats[insurerName].totalCount++;
            
            if (!insurerStats[insurerName].history[monthKey]) insurerStats[insurerName].history[monthKey] = 0;
            insurerStats[insurerName].history[monthKey] += pTotal;
        });

        // 4. Formateo de Salida (JSON limpio para el Frontend)
        const insurerData = Object.keys(byInsurer).map(k => ({ name: k, value: byInsurer[k] }));
        const monthlyData = Object.values(byMonth).sort((a,b) => a.mes.localeCompare(b.mes));
        
        const insurerDetailed = Object.values(insurerStats).map(ins => {
            const chartData = Object.keys(ins.history).sort().map(m => ({ mes: m, venta: ins.history[m] }));
            return { ...ins, chartData };
        });

        return { 
            counts, 
            earnings, 
            insurerData, // Para gráfica de Pastel
            monthlyData, // Para gráfica de Barras
            insurerDetailed // Para tablas detalladas
        };

    } catch (error) {
        console.error("❌ Error en calculateGeneralMetrics:", error.message);
        throw error; // Lanzamos el error para que el controlador lo vea
    }
  }
}

module.exports = new MetricsService();