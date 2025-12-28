import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

export default function MetricsView() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedInsurer, setSelectedInsurer] = useState('Banorte')

  const ASEGURADORAS_LIST = ['Banorte', 'Atlas', 'Qualitas', 'Inbursa', 'General de Seguros', 'Latino', 'HDI', 'Axa']

  useEffect(() => {
    fetch('http://localhost:3000/api/metricas')
      .then(res => {
        if (!res.ok) throw new Error('Error conectando al servidor')
        return res.json()       
      })
      .then(data => {
        setMetrics(data)
        if(data.insurerDetailed?.length > 0) setSelectedInsurer(data.insurerDetailed[0].name)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}><h2>🔄 Calculando historial...</h2></div>
  if (error) return <div style={{padding:'40px', textAlign:'center', color:'#ef4444'}}><h2>⚠️ Error de conexión</h2><p>{error}</p></div>

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4']
  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  const currentInsurerData = metrics.insurerDetailed?.find(i => i.name === selectedInsurer)
  const availableOptions = Array.from(new Set([...ASEGURADORAS_LIST, ...(metrics.insurerDetailed?.map(i => i.name) || [])])).sort()
  
  // --- CÁLCULO DE TOTALES PARA LA TABLA ---
  const tableTotals = metrics.monthlyData.reduce((acc, curr) => ({
      polizas: acc.polizas + curr.count,
      total: acc.total + curr.total,
      neta: acc.neta + curr.neta
  }), { polizas: 0, total: 0, neta: 0 })

  // Estilos
  const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '200px' }
  const titleStyle = { color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }
  const bigNumber = { fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      
      <h2 style={{color:'#0f172a', marginBottom:'20px'}}>📈 Reporte de Rendimiento</h2>

      {/* 1. TARJETAS SUPERIORES */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={cardStyle}><div style={titleStyle}>Ventas Mes Actual</div><div style={bigNumber}>📄 {metrics.counts.mes}</div></div>
        <div style={cardStyle}><div style={titleStyle}>Trimestre</div><div style={bigNumber}>📅 {metrics.counts.trimestre}</div></div>
        <div style={cardStyle}><div style={titleStyle}>Año en Curso</div><div style={bigNumber}>🗓️ {metrics.counts.anio}</div></div>
        <div style={{...cardStyle, background:'#0f172a'}}>
            <div style={{...titleStyle, color:'#94a3b8'}}>Ganancia Neta Total</div>
            <div style={{...bigNumber, color:'#4ade80'}}>{money(metrics.earnings.neta)}</div>
            <div style={{fontSize:'12px', color:'#cbd5e1'}}>De Prima Total: {money(metrics.earnings.total)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* 2. GRÁFICA BARRAS */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <h3 style={{marginTop:0, color:'#0f172a'}}>💰 Ingresos Mensuales</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                    <Bar dataKey="total" name="Prima Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="neta" name="Ganancia Neta" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* 3. GRÁFICA PASTEL */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <h3 style={{marginTop:0, color:'#0f172a'}}>🏢 Por Aseguradora</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={metrics.insurerData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {metrics.insurerData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. FILTRO DETALLADO */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom:'30px' }}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #f1f5f9', paddingBottom:'15px'}}>
            <h3 style={{margin:0, color:'#0f172a'}}>📊 Detalle: {selectedInsurer}</h3>
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
                         <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>PÓLIZAS</div>
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

      {/* 5. TABLA HISTÓRICA CON TOTALES (La actualización clave) */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
         <h3 style={{marginTop:0, color:'#0f172a'}}>📑 Cierre Mensual Global (Histórico)</h3>
         <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
            <thead>
                <tr style={{borderBottom:'2px solid #e2e8f0', color:'#64748b', background:'#f8fafc'}}>
                    <th style={{padding:'15px'}}>Mes</th>
                    <th>Pólizas Vendidas</th>
                    <th>Prima Total ($)</th>
                    <th>Ganancia Neta ($)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {metrics.monthlyData.length === 0 ? (
                    <tr><td colSpan="5" style={{padding:'20px', textAlign:'center', color:'#94a3b8'}}>Sin datos registrados</td></tr>
                ) : metrics.monthlyData.map((m, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'15px', fontWeight:'bold', fontFamily:'monospace'}}>{m.mes}</td>
                        <td style={{padding:'15px'}}>{m.count}</td>
                        <td style={{color:'#3b82f6'}}>{money(m.total)}</td>
                        <td style={{color:'#16a34a', fontWeight:'bold'}}>{money(m.neta)}</td>
                        <td><span style={{background:'#f1f5f9', padding:'4px 10px', borderRadius:'10px', fontSize:'11px', color:'#64748b'}}>CERRADO</span></td>
                    </tr>
                ))}
            </tbody>
            {/* --- PIE DE TABLA CON TOTALES --- */}
            <tfoot style={{background:'#0f172a', color:'white', fontWeight:'bold'}}>
                <tr>
                    <td style={{padding:'15px'}}>TOTAL GLOBAL</td>
                    <td style={{padding:'15px'}}>{tableTotals.polizas}</td>
                    <td style={{color:'#38bdf8'}}>{money(tableTotals.total)}</td>
                    <td style={{color:'#4ade80'}}>{money(tableTotals.neta)}</td>
                    <td>-</td>
                </tr>
            </tfoot>
         </table>
      </div>

    </div>
  )
}