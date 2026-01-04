import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function HistoryMetricsView({ onBack }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // --- FILTROS ---
  const [year, setYear] = useState(new Date().getFullYear())
  // Inicializamos con todos los meses seleccionados
  const [selectedMonths, setSelectedMonths] = useState([1,2,3,4,5,6,7,8,9,10,11,12])

  const MONTHS_LABELS = [
      { id: 1, label: 'ENE' }, { id: 2, label: 'FEB' }, { id: 3, label: 'MAR' },
      { id: 4, label: 'ABR' }, { id: 5, label: 'MAY' }, { id: 6, label: 'JUN' },
      { id: 7, label: 'JUL' }, { id: 8, label: 'AGO' }, { id: 9, label: 'SEP' },
      { id: 10, label: 'OCT' }, { id: 11, label: 'NOV' }, { id: 12, label: 'DIC' }
  ]

  useEffect(() => {
    fetch('http://localhost:3000/api/metricas')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  // --- LÓGICA DE SELECCIÓN DE MESES ---
  const toggleMonth = (monthId) => {
      if (selectedMonths.includes(monthId)) {
          if(selectedMonths.length > 0) {
              setSelectedMonths(selectedMonths.filter(id => id !== monthId))
          }
      } else {
          setSelectedMonths([...selectedMonths, monthId].sort((a,b) => a - b))
      }
  }

  const selectAll = () => setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12])
  
  // AHORA SÍ USAMOS ESTA FUNCIÓN EN EL JSX
  const clearSelection = () => setSelectedMonths([]) 

  // --- FILTRADO DE DATOS ---
  const filteredData = useMemo(() => {
      if (!metrics) return []
      
      return metrics.monthlyData.filter(m => {
          const [mYear, mMonth] = m.mes.split('-').map(Number)
          return mYear === year && selectedMonths.includes(mMonth)
      })
  }, [metrics, year, selectedMonths])

  // --- RESUMEN DE LOS MESES SELECCIONADOS ---
  const periodSummary = useMemo(() => {
      return filteredData.reduce((acc, curr) => ({
          total: acc.total + curr.total,
          neta: acc.neta + curr.neta,
          count: acc.count + curr.count
      }), { total: 0, neta: 0, count: 0 })
  }, [filteredData])

  // --- PIE CHART ---
  const periodPieData = useMemo(() => {
      if(!metrics) return []
      const activeMonths = filteredData.map(m => m.mes)
      
      return metrics.insurerDetailed.map(ins => {
          let sum = 0
          activeMonths.forEach(mes => {
              sum += (ins.history[mes] || 0)
          })
          return { name: ins.name, value: sum }
      }).filter(i => i.value > 0).sort((a,b) => b.value - a.value)
  }, [filteredData, metrics])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  if (loading) return <div style={{padding:'40px', color:'#64748b'}}>Cargando historial...</div>

  // ESTILOS
  const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }
  
  const monthBtnStyle = (isActive) => ({
      padding: '8px 12px', 
      borderRadius: '6px', 
      border: isActive ? '1px solid #3b82f6' : '1px solid #e2e8f0', 
      cursor: 'pointer', 
      fontSize: '11px', 
      fontWeight: 'bold',
      background: isActive ? '#eff6ff' : 'white', 
      color: isActive ? '#1e40af' : '#64748b',
      transition: 'all 0.1s'
  })

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom:'50px' }}>
      
      {/* HEADER */}
      <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'25px'}}>
          <button onClick={onBack} style={{background:'white', border:'1px solid #cbd5e1', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer', fontSize:'18px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>←</button>
          <div>
              <h2 style={{color:'#0f172a', margin:0}}>Historial y Comparativas</h2>
              <p style={{margin:0, color:'#64748b', fontSize:'14px'}}>Selecciona los meses que deseas analizar.</p>
          </div>
      </div>

      {/* --- BARRA DE FILTROS (SELECTOR DE MESES) --- */}
      <div style={{...cardStyle, marginBottom:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <span style={{fontSize:'13px', fontWeight:'bold', color:'#0f172a'}}>AÑO:</span>
                  <select value={year} onChange={e=>setYear(Number(e.target.value))} style={{padding:'6px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                  </select>
              </div>
              
              {/* BOTONES DE SELECCIÓN RÁPIDA */}
              <div style={{display:'flex', gap:'15px'}}>
                  <button onClick={selectAll} style={{fontSize:'11px', color:'#3b82f6', background:'transparent', border:'none', cursor:'pointer', fontWeight:'bold', textDecoration:'underline'}}>
                      Seleccionar Todo
                  </button>
                  {/* AQUÍ AGREGAMOS EL USO DE clearSelection */}
                  <button onClick={clearSelection} style={{fontSize:'11px', color:'#ef4444', background:'transparent', border:'none', cursor:'pointer', fontWeight:'bold', textDecoration:'underline'}}>
                      Limpiar
                  </button>
              </div>
          </div>

          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              {MONTHS_LABELS.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => toggleMonth(m.id)} 
                    style={monthBtnStyle(selectedMonths.includes(m.id))}
                  >
                      {m.label}
                  </button>
              ))}
          </div>
      </div>

      {/* RESUMEN DE LA SELECCIÓN */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px', marginBottom:'30px'}}>
          <div style={{...cardStyle, borderLeft:'4px solid #3b82f6'}}>
              <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold', textTransform:'uppercase'}}>Venta (Meses Seleccionados)</div>
              <div style={{fontSize:'28px', color:'#0f172a', fontWeight:'bold'}}>{money(periodSummary.total)}</div>
          </div>
          <div style={{...cardStyle, borderLeft:'4px solid #10b981'}}>
              <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold', textTransform:'uppercase'}}>Utilidad Neta</div>
              <div style={{fontSize:'28px', color:'#059669', fontWeight:'bold'}}>{money(periodSummary.neta)}</div>
          </div>
          <div style={{...cardStyle, borderLeft:'4px solid #f59e0b'}}>
              <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold', textTransform:'uppercase'}}>Pólizas Colocadas</div>
              <div style={{fontSize:'28px', color:'#d97706', fontWeight:'bold'}}>{periodSummary.count}</div>
          </div>
      </div>

      {/* GRÁFICAS COMPARATIVAS */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'30px'}}>
          
          {/* 1. BARRAS: COMPARATIVA MENSUAL */}
          <div style={{...cardStyle, minHeight:'400px'}}>
              <h3 style={{marginTop:0, color:'#0f172a'}}>📊 Comparativa Mensual</h3>
              <p style={{fontSize:'13px', color:'#64748b', marginBottom:'20px'}}>
                  {selectedMonths.length > 1 ? 'Comparando rendimiento entre los meses seleccionados.' : 'Visualizando detalle del mes seleccionado.'}
              </p>
              
              {filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mes" tickFormatter={(val) => val.split('-')[1]} />
                        <YAxis />
                        <Tooltip formatter={(value) => money(value)} labelFormatter={(label) => `Periodo: ${label}`} />
                        <Legend />
                        <Bar dataKey="total" name="Venta Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="neta" name="Utilidad" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              ) : (
                  <div style={{height:'300px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>
                      Selecciona al menos un mes con datos.
                  </div>
              )}
          </div>

          {/* 2. PASTEL: SHARE ACUMULADO */}
          <div style={{...cardStyle, minHeight:'400px'}}>
              <h3 style={{marginTop:0, color:'#0f172a'}}>🍰 Share Acumulado</h3>
              <p style={{fontSize:'13px', color:'#64748b', marginBottom:'20px'}}>Distribución total en la selección.</p>
              
              {periodPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={periodPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {periodPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => money(value)} />
                        <Legend />
                    </PieChart>
                  </ResponsiveContainer>
              ) : (
                  <div style={{height:'300px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>
                      Sin datos.
                  </div>
              )}
          </div>

      </div>
    </div>
  )
}