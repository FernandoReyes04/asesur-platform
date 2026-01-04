import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { supabase } from '../supabaseClient'
import '../styles/MetricsView.css' // <--- IMPORTAMOS CSS

export default function MetricsView({ onViewHistory }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [demographics, setDemographics] = useState({ average: 0, youngest: 0, oldest: 0, groups: [] })
  const [selectedInsurer, setSelectedInsurer] = useState('Banorte')
  const ASEGURADORAS_LIST = ['Banorte', 'Atlas', 'Qualitas', 'Inbursa', 'General de Seguros', 'Latino', 'HDI', 'Axa']

  useEffect(() => {
    // 1. Carga Métricas
    const fetchFinancials = fetch('http://localhost:3000/api/metricas')
      .then(res => {
        if (!res.ok) throw new Error('Error conectando al servidor')
        return res.json()       
      })

    // 2. Carga Demografía
    const fetchDemographics = async () => {
        const { data: clients } = await supabase.from('clientes').select('fecha_nacimiento')
        
        if (!clients || clients.length === 0) return;

        let totalAge = 0;
        let validCount = 0;
        let minAge = 100;
        let maxAge = 0;
        let ranges = { '18-30': 0, '31-45': 0, '46-60': 0, '60+': 0 }

        clients.forEach(c => {
            if (c.fecha_nacimiento) {
                const birthDate = new Date(c.fecha_nacimiento);
                const ageDifMs = Date.now() - birthDate.getTime();
                const ageDate = new Date(ageDifMs);
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);

                if (age > 0 && age < 110) { 
                    totalAge += age;
                    validCount++;
                    if (age < minAge) minAge = age;
                    if (age > maxAge) maxAge = age;
                    if (age <= 30) ranges['18-30']++;
                    else if (age <= 45) ranges['31-45']++;
                    else if (age <= 60) ranges['46-60']++;
                    else ranges['60+']++;
                }
            }
        });

        const avg = validCount > 0 ? (totalAge / validCount).toFixed(1) : 0;
        const groupsArray = [
            { range: 'Jóvenes (18-30)', count: ranges['18-30'], pct: validCount ? ((ranges['18-30']/validCount)*100).toFixed(0) : 0 },
            { range: 'Adultos Jovenes (31-45)', count: ranges['31-45'], pct: validCount ? ((ranges['31-45']/validCount)*100).toFixed(0) : 0 },
            { range: 'Adultos Maduros (46-60)', count: ranges['46-60'], pct: validCount ? ((ranges['46-60']/validCount)*100).toFixed(0) : 0 },
            { range: 'Adultos Mayores (60+)', count: ranges['60+'], pct: validCount ? ((ranges['60+']/validCount)*100).toFixed(0) : 0 },
        ].sort((a,b) => b.count - a.count)

        setDemographics({ average: avg, youngest: minAge === 100 ? 0 : minAge, oldest: maxAge, groups: groupsArray })
    }

    Promise.all([fetchFinancials, fetchDemographics()])
      .then(([financialData]) => {
        setMetrics(financialData)
        if(financialData.insurerDetailed?.length > 0) setSelectedInsurer(financialData.insurerDetailed[0].name)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const currentStats = useMemo(() => {
      if (!metrics) return { total: 0, neta: 0, count: 0, monthName: '' };
      
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const stats = metrics.monthlyData.find(m => m.mes === currentMonthStr) || { total: 0, neta: 0, count: 0 };
      const monthName = today.toLocaleString('es-MX', { month: 'long' });
      
      return { ...stats, monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1) };
  }, [metrics])

  const currentMonthPieData = useMemo(() => {
      if (!metrics) return [];
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      return metrics.insurerDetailed.map(insurer => ({
          name: insurer.name,
          value: insurer.history[currentMonthStr] || 0
      })).filter(item => item.value > 0)
  }, [metrics])

  if (loading) return <div className="loading-container"><h2>🔄 Calculando finanzas...</h2></div>
  if (error) return <div className="error-container"><h2>⚠️ Error de conexión</h2><p>{error}</p></div>

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4']
  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  const currentInsurerData = metrics.insurerDetailed?.find(i => i.name === selectedInsurer)
  const availableOptions = Array.from(new Set([...ASEGURADORAS_LIST, ...(metrics.insurerDetailed?.map(i => i.name) || [])])).sort()

  return (
    <div className="metrics-container">
      
      {/* HEADER */}
      <div className="header-row">
        <div>
            <h2 className="page-title">📈 Reporte Financiero</h2>
            <p className="page-subtitle">
                Panorama actual de <strong>{currentStats.monthName}</strong> y acumulados.
            </p>
        </div>
        
        <button onClick={onViewHistory} className="history-btn">
            📜 Ver Historial Comparativo
        </button>
      </div>

      {/* 1. TARJETAS (ENFOQUE: MES ACTUAL) */}
      <div className="kpi-grid">
        <div className="kpi-card">
            <div className="kpi-title">Ventas de {currentStats.monthName}</div>
            <div className="kpi-value blue">{money(currentStats.total)}</div>
            <div className="kpi-subtitle">Prima Total colocada</div>
        </div>
        
        <div className="kpi-card">
            <div className="kpi-title">Pólizas {currentStats.monthName}</div>
            <div className="kpi-value">📄 {currentStats.count}</div>
            <div className="kpi-subtitle">Cerradas este mes</div>
        </div>

        <div className="kpi-card dark">
            <div className="kpi-title dark">
                Utilidad Neta {currentStats.monthName}
            </div>
            <div className="kpi-value green">{money(currentStats.neta)}</div>
            <div className="kpi-subtitle dark">Ganancia del periodo</div>
        </div>
      </div>

      <div className="charts-grid">
        
        {/* 2. GRÁFICA DE BARRAS */}
        <div className="chart-card">
            <div className="chart-header">
                <h3 className="chart-title">💰 Historial Anual</h3>
                <p className="chart-subtitle">Tendencia de ventas mes a mes.</p>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => money(value)} />
                        <Legend />
                        <Bar dataKey="total" name="Prima Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="neta" name="Utilidad Neta" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. GRÁFICA DE PASTEL */}
        <div className="chart-card">
            <div className="chart-header">
                <h3 className="chart-title">🏢 Share: {currentStats.monthName}</h3>
                <p className="chart-subtitle">Participación de mercado actual.</p>
            </div>
            
            {currentMonthPieData.length === 0 ? (
                <div className="empty-chart">
                    Sin ventas este mes.
                </div>
            ) : (
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={currentMonthPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                {currentMonthPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => money(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
      </div>

      {/* --- DEMOGRAFÍA --- */}
      <div className="demographics-section">
          <div className="section-header">
             <h3 className="section-title">👥 Perfil Demográfico</h3>
             <p className="section-subtitle">Edad promedio de la cartera de clientes.</p>
          </div>

          <div className="demographics-grid">
              <div className="stats-column">
                  <div className="avg-card">
                      <div className="avg-label">Edad Promedio</div>
                      <div className="avg-value">{demographics.average} <span className="avg-unit">años</span></div>
                  </div>
                  <div className="min-max-row">
                      <div className="stat-box green">
                          <div className="stat-label green">MÁS JOVEN</div>
                          <div className="stat-number green">{demographics.youngest}</div>
                      </div>
                      <div className="stat-box red">
                          <div className="stat-label red">MÁS GRANDE</div>
                          <div className="stat-number red">{demographics.oldest}</div>
                      </div>
                  </div>
              </div>

              <div className="table-column">
                  <h4>Distribución por Rango de Edad</h4>
                  <table className="demographics-table">
                      <thead>
                          <tr>
                              <th>Grupo</th>
                              <th>Clientes</th>
                              <th>Porcentaje</th>
                          </tr>
                      </thead>
                      <tbody>
                          {demographics.groups.map((g, i) => (
                              <tr key={i}>
                                  <td style={{fontWeight:'500', color:'#334155'}}>
                                      <span className="legend-dot" style={{ background: i===0?'#3b82f6':'#cbd5e1' }}></span>
                                      {g.range}
                                  </td>
                                  <td style={{fontWeight:'bold'}}>{g.count}</td>
                                  <td>
                                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                          <div className="progress-bar-bg">
                                              <div className="progress-bar-fill" style={{width:`${g.pct}%`}}></div>
                                          </div>
                                          <span className="progress-text">{g.pct}%</span>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* 4. FILTRO DETALLADO POR ASEGURADORA */}
      <div className="chart-card" style={{minHeight:'auto'}}>
         <div className="filter-header">
            <h3 className="chart-title">📊 Detalle por Aseguradora (Histórico)</h3>
            <select 
                value={selectedInsurer} 
                onChange={(e) => setSelectedInsurer(e.target.value)}
                className="filter-select"
            >
                {availableOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
         </div>

         {currentInsurerData ? (
             <div className="detail-grid">
                 <div className="detail-stats">
                     <div className="detail-box">
                         <div className="detail-label">VENTAS TOTALES</div>
                         <div className="detail-value blue">{money(currentInsurerData.totalSales)}</div>
                     </div>
                     <div className="detail-box">
                         <div className="detail-label">PÓLIZAS TOTALES</div>
                         <div className="detail-value dark">{currentInsurerData.totalCount}</div>
                     </div>
                 </div>
                 <div className="detail-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={currentInsurerData.chartData}>
                            <defs>
                                <linearGradient id="colorVenta" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip formatter={(value) => money(value)} />
                            <Area type="monotone" dataKey="venta" stroke="#8884d8" fillOpacity={1} fill="url(#colorVenta)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
             </div>
         ) : (
             <div className="empty-detail">
                <p>No hay ventas registradas para <strong>{selectedInsurer}</strong>.</p>
             </div>
         )}
      </div>

    </div>
  )
}