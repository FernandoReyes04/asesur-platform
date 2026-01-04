import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { supabase } from '../supabaseClient'

// ACEPTAMOS LA PROP 'onViewHistory' PARA NAVEGAR
export default function MetricsView({ onViewHistory }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estado para Demografía
  const [demographics, setDemographics] = useState({ average: 0, youngest: 0, oldest: 0, groups: [] })

  // Filtro simple para detalle de aseguradora
  const [selectedInsurer, setSelectedInsurer] = useState('Banorte')
  const ASEGURADORAS_LIST = ['Banorte', 'Atlas', 'Qualitas', 'Inbursa', 'General de Seguros', 'Latino', 'HDI', 'Axa']

  useEffect(() => {
    // 1. Carga Métricas Financieras
    const fetchFinancials = fetch('http://localhost:3000/api/metricas')
      .then(res => {
        if (!res.ok) throw new Error('Error conectando al servidor')
        return res.json()       
      })

    // 2. Carga Datos Demográficos
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

  // --- CÁLCULO EN TIEMPO REAL: MES ACTUAL ---
  const currentStats = useMemo(() => {
      if (!metrics) return { total: 0, neta: 0, count: 0, monthName: '' };
      
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const stats = metrics.monthlyData.find(m => m.mes === currentMonthStr) || { total: 0, neta: 0, count: 0 };
      const monthName = today.toLocaleString('es-MX', { month: 'long' });
      
      return { ...stats, monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1) };
  }, [metrics])

  // --- PASTEL: SOLO MES ACTUAL ---
  const currentMonthPieData = useMemo(() => {
      if (!metrics) return [];
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      return metrics.insurerDetailed.map(insurer => ({
          name: insurer.name,
          value: insurer.history[currentMonthStr] || 0
      })).filter(item => item.value > 0)
  }, [metrics])

  if (loading) return <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}><h2>🔄 Calculando finanzas...</h2></div>
  if (error) return <div style={{padding:'40px', textAlign:'center', color:'#ef4444'}}><h2>⚠️ Error de conexión</h2><p>{error}</p></div>

  // Helpers
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4']
  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  const currentInsurerData = metrics.insurerDetailed?.find(i => i.name === selectedInsurer)
  const availableOptions = Array.from(new Set([...ASEGURADORAS_LIST, ...(metrics.insurerDetailed?.map(i => i.name) || [])])).sort()

  const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '200px' }
  const titleStyle = { color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }
  const bigNumber = { fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* HEADER CON BOTÓN NUEVO */}
      <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h2 style={{color:'#0f172a', margin:0}}>📈 Reporte Financiero</h2>
            <p style={{margin:0, color:'#64748b', fontSize:'14px'}}>
                Panorama actual de <strong>{currentStats.monthName}</strong>.
            </p>
        </div>
        
        {/* --- BOTÓN PARA VER HISTORIAL --- */}
        <button 
            onClick={onViewHistory}
            style={{
                background: 'white', 
                border: '1px solid #3b82f6', 
                color: '#3b82f6', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                fontSize: '13px'
            }}
        >
            📜 Ver Historial Comparativo
        </button>
      </div>

      {/* 1. TARJETAS (ENFOQUE: MES ACTUAL) */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={cardStyle}>
            <div style={titleStyle}>Ventas de {currentStats.monthName}</div>
            <div style={{...bigNumber, color:'#3b82f6'}}>{money(currentStats.total)}</div>
            <div style={{fontSize:'12px', color:'#64748b', marginTop:'5px'}}>Prima Total colocada</div>
        </div>
        
        <div style={cardStyle}>
            <div style={titleStyle}>Pólizas {currentStats.monthName}</div>
            <div style={bigNumber}>📄 {currentStats.count}</div>
            <div style={{fontSize:'12px', color:'#64748b', marginTop:'5px'}}>Cerradas este mes</div>
        </div>

        <div style={{...cardStyle, background:'#0f172a'}}>
            <div style={{...titleStyle, color:'#94a3b8'}}>
                Utilidad Neta {currentStats.monthName}
            </div>
            <div style={{...bigNumber, color:'#4ade80'}}>{money(currentStats.neta)}</div>
            <div style={{fontSize:'12px', color:'#cbd5e1'}}>Ganancia del periodo</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px' }}>
        
        {/* 2. GRÁFICA DE BARRAS (HISTORIAL PARA CONTEXTO) */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <h3 style={{marginTop:0, color:'#0f172a'}}>💰 Historial Anual</h3>
            <p style={{fontSize:'12px', color:'#64748b', marginTop:-10, marginBottom:20}}>Tendencia de ventas mes a mes.</p>
            <ResponsiveContainer width="100%" height={300}>
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

        {/* 3. GRÁFICA DE PASTEL (MES ACTUAL) */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <h3 style={{marginTop:0, color:'#0f172a'}}>🏢 Share: {currentStats.monthName}</h3>
            <p style={{fontSize:'12px', color:'#64748b', marginTop:-10, marginBottom:10}}>Participación de mercado actual.</p>
            
            {currentMonthPieData.length === 0 ? (
                <div style={{height:'300px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontStyle:'italic'}}>
                    Sin ventas este mes.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={currentMonthPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {currentMonthPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => money(value)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* --- SECCIÓN DEMOGRAFÍA DE CLIENTES --- */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom:'30px' }}>
          <div style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'15px', marginBottom:'20px'}}>
             <h3 style={{margin:0, color:'#0f172a'}}>👥 Perfil Demográfico</h3>
             <p style={{margin:0, fontSize:'13px', color:'#64748b'}}>Edad promedio de la cartera de clientes.</p>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'30px'}}>
              <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <div style={{background:'#f8fafc', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', textAlign:'center'}}>
                      <div style={{fontSize:'13px', color:'#64748b', fontWeight:'bold', textTransform:'uppercase'}}>Edad Promedio</div>
                      <div style={{fontSize:'36px', color:'#3b82f6', fontWeight:'bold'}}>{demographics.average} <span style={{fontSize:'16px', color:'#94a3b8'}}>años</span></div>
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                      <div style={{flex:1, background:'#f0fdf4', padding:'15px', borderRadius:'12px', border:'1px solid #bbf7d0', textAlign:'center'}}>
                          <div style={{fontSize:'11px', color:'#166534', fontWeight:'bold'}}>MÁS JOVEN</div>
                          <div style={{fontSize:'20px', color:'#15803d', fontWeight:'bold'}}>{demographics.youngest}</div>
                      </div>
                      <div style={{flex:1, background:'#fef2f2', padding:'15px', borderRadius:'12px', border:'1px solid #fecaca', textAlign:'center'}}>
                          <div style={{fontSize:'11px', color:'#991b1b', fontWeight:'bold'}}>MÁS GRANDE</div>
                          <div style={{fontSize:'20px', color:'#b91c1c', fontWeight:'bold'}}>{demographics.oldest}</div>
                      </div>
                  </div>
              </div>

              <div>
                  <h4 style={{marginTop:0, color:'#475569', fontSize:'14px'}}>Distribución por Rango de Edad</h4>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                      <thead>
                          <tr style={{background:'#f1f5f9', color:'#64748b', textAlign:'left'}}>
                              <th style={{padding:'10px', borderRadius:'6px 0 0 6px'}}>Grupo</th>
                              <th style={{padding:'10px'}}>Clientes</th>
                              <th style={{padding:'10px', borderRadius:'0 6px 6px 0'}}>Porcentaje</th>
                          </tr>
                      </thead>
                      <tbody>
                          {demographics.groups.map((g, i) => (
                              <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                                  <td style={{padding:'10px', fontWeight:'500', color:'#334155'}}>
                                      <span style={{display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background: i===0?'#3b82f6':'#cbd5e1', marginRight:'8px'}}></span>
                                      {g.range}
                                  </td>
                                  <td style={{padding:'10px', fontWeight:'bold'}}>{g.count}</td>
                                  <td style={{padding:'10px'}}>
                                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                          <div style={{flex:1, height:'6px', background:'#e2e8f0', borderRadius:'3px', overflow:'hidden'}}>
                                              <div style={{width:`${g.pct}%`, height:'100%', background:'#3b82f6', borderRadius:'3px'}}></div>
                                          </div>
                                          <span style={{fontSize:'12px', color:'#64748b', width:'30px'}}>{g.pct}%</span>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* 4. FILTRO DETALLADO POR ASEGURADORA (ACUMULADO HISTÓRICO) */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #f1f5f9', paddingBottom:'15px'}}>
            <h3 style={{margin:0, color:'#0f172a'}}>📊 Detalle por Aseguradora (Histórico)</h3>
            <select 
                value={selectedInsurer} 
                onChange={(e) => setSelectedInsurer(e.target.value)}
                style={{padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'14px', minWidth:'200px'}}
            >
                {availableOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
         </div>

         {currentInsurerData ? (
             <div style={{display:'grid', gridTemplateColumns:'1fr 3fr', gap:'30px'}}>
                 <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                     <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                         <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>VENTAS TOTALES</div>
                         <div style={{fontSize:'24px', color:'#2563eb', fontWeight:'bold'}}>{money(currentInsurerData.totalSales)}</div>
                     </div>
                     <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                         <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>PÓLIZAS TOTALES</div>
                         <div style={{fontSize:'24px', color:'#0f172a', fontWeight:'bold'}}>{currentInsurerData.totalCount}</div>
                     </div>
                 </div>
                 <div style={{height:'250px'}}>
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
             <div style={{padding:'40px', textAlign:'center', color:'#94a3b8', background:'#f8fafc', borderRadius:'8px'}}>
                <p>No hay ventas registradas para <strong>{selectedInsurer}</strong>.</p>
             </div>
         )}
      </div>

    </div>
  )
}