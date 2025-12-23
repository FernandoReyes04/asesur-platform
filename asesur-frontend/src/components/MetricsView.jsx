import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function MetricsView() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // Nuevo estado para errores

  useEffect(() => {
    fetch('http://localhost:3000/api/metricas')
      .then(res => {
        if (!res.ok) throw new Error('Error conectando al servidor')
        return res.json()
      })
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message) // Guardamos el error
        setLoading(false) // Quitamos el loading aunque falle
      })
  }, [])

  // 1. PANTALLA DE CARGA
  if (loading) return (
    <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>
      <h2>🔄 Analizando datos...</h2>
    </div>
  )

  // 2. PANTALLA DE ERROR (Si algo falla, te dirá qué)
  if (error) return (
    <div style={{padding:'40px', textAlign:'center', color:'#ef4444'}}>
      <h2>⚠️ Ups, algo falló</h2>
      <p>{error}</p>
      <p style={{fontSize:'12px', color:'#64748b'}}>Asegúrate de que el backend esté corriendo y la ruta /api/metricas exista.</p>
    </div>
  )

  // 3. CONTENIDO PRINCIPAL (Si todo sale bien)
  // Colores para gráfica de pastel
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  
  // Helper moneda
  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  // Estilos
  const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '200px' }
  const titleStyle = { color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }
  const bigNumber = { fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      
      <h2 style={{color:'#0f172a', marginBottom:'20px'}}>📈 Reporte de Rendimiento</h2>

      {/* 1. TARJETAS DE CONTEO */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={cardStyle}>
            <div style={titleStyle}>Ventas Mes Actual</div>
            <div style={bigNumber}>📄 {metrics.counts.mes}</div>
        </div>
        <div style={cardStyle}>
            <div style={titleStyle}>Trimestre</div>
            <div style={bigNumber}>📅 {metrics.counts.trimestre}</div>
        </div>
        <div style={cardStyle}>
            <div style={titleStyle}>Año en Curso</div>
            <div style={bigNumber}>🗓️ {metrics.counts.anio}</div>
        </div>
        <div style={{...cardStyle, background:'#0f172a'}}>
            <div style={{...titleStyle, color:'#94a3b8'}}>Ganancia Neta Total</div>
            <div style={{...bigNumber, color:'#4ade80'}}>{money(metrics.earnings.neta)}</div>
            <div style={{fontSize:'12px', color:'#cbd5e1'}}>De Prima Total: {money(metrics.earnings.total)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px' }}>
        
        {/* 2. GRÁFICA DE BARRAS */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <h3 style={{marginTop:0, color:'#0f172a'}}>💰 Comportamiento de Ganancias</h3>
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

        {/* 3. GRÁFICA DE PASTEL */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <h3 style={{marginTop:0, color:'#0f172a'}}>🏢 Share por Aseguradora</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={metrics.insurerData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        paddingAngle={5} dataKey="value"
                    >
                        {metrics.insurerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. TABLA DETALLADA */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
         <h3 style={{marginTop:0, color:'#0f172a'}}>📑 Desglose de Cierre Mensual</h3>
         <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
            <thead>
                <tr style={{borderBottom:'2px solid #f1f5f9', color:'#64748b'}}>
                    <th style={{padding:'15px'}}>Mes de Cierre</th>
                    <th>Pólizas Vendidas</th>
                    <th>Prima Total (Ingreso)</th>
                    <th>Prima Neta (Utilidad)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {metrics.monthlyData.length === 0 ? (
                    <tr><td colSpan="5" style={{padding:'20px', textAlign:'center', color:'#94a3b8'}}>No hay datos registrados aún.</td></tr>
                ) : metrics.monthlyData.map((m, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'15px', fontWeight:'bold', fontFamily:'monospace'}}>{m.mes}</td>
                        <td style={{padding:'15px'}}>{m.count}</td>
                        <td style={{color:'#3b82f6', fontWeight:'bold'}}>{money(m.total)}</td>
                        <td style={{color:'#16a34a', fontWeight:'bold'}}>{money(m.neta)}</td>
                        <td><span style={{background:'#f1f5f9', padding:'4px 10px', borderRadius:'10px', fontSize:'11px', color:'#64748b'}}>CERRADO</span></td>
                    </tr>
                ))}
                
                {/* FILA DE TOTALES */}
                <tr style={{background:'#f8fafc', fontWeight:'bold'}}>
                    <td style={{padding:'15px'}}>TOTAL ACUMULADO</td>
                    <td style={{padding:'15px'}}>{metrics.counts.anio} (Anual)</td>
                    <td style={{color:'#1e40af'}}>{money(metrics.earnings.total)}</td>
                    <td style={{color:'#15803d'}}>{money(metrics.earnings.neta)}</td>
                    <td></td>
                </tr>
            </tbody>
         </table>
      </div>

    </div>
  )
}