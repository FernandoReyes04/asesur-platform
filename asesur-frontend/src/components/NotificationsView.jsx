import { useEffect, useState, useMemo } from 'react'

export default function NotificationsView() {
  const [allReceipts, setAllReceipts] = useState([]) // Todos los datos crudos
  const [filteredReceipts, setFilteredReceipts] = useState([]) // Datos filtrados para mostrar
  const [loading, setLoading] = useState(true)

  // --- ESTADOS DE FILTROS ---
  const [filterDate, setFilterDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')

  useEffect(() => {
    fetch('http://localhost:3000/api/notificaciones')
      .then(res => res.json())
      .then(result => {
        // 1. Unificamos Vencidos y Próximos en una sola lista maestra
        // Agregamos una etiqueta 'status' para poder filtrar
        const overdue = (result.overdue || []).map(i => ({ ...i, status: 'Vencido' }))
        const upcoming = (result.upcoming || []).map(i => ({ ...i, status: 'Por Vencer' }))
        
        const combined = [...overdue, ...upcoming].sort((a,b) => new Date(a.recibo_inicio) - new Date(b.recibo_inicio))
        
        setAllReceipts(combined)
        setFilteredReceipts(combined)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // --- LÓGICA DE FILTRADO ---
  const handleFilter = () => {
    let result = allReceipts

    // 1. Filtro por Fecha Exacta
    if (filterDate) {
        result = result.filter(item => item.recibo_inicio === filterDate)
    }

    // 2. Búsqueda por Póliza o Cliente
    if (searchTerm) {
        const term = searchTerm.toLowerCase()
        result = result.filter(item => 
            item.numero_poliza.toLowerCase().includes(term) ||
            item.aseguradora.toLowerCase().includes(term) ||
            item.clientes?.nombre?.toLowerCase().includes(term) ||
            item.clientes?.apellido?.toLowerCase().includes(term)
        )
    }

    // 3. Filtro por Estatus
    if (filterStatus !== 'Todos') {
        result = result.filter(item => item.status === filterStatus)
    }

    setFilteredReceipts(result)
  }

  const clearFilters = () => {
      setFilterDate('')
      setSearchTerm('')
      setFilterStatus('Todos')
      setFilteredReceipts(allReceipts)
  }

  // --- LÓGICA PARA LA LÍNEA DE TIEMPO (Agrupar por fecha) ---
  const timelineData = useMemo(() => {
      const groups = {}
      filteredReceipts.forEach(item => {
          const date = item.recibo_inicio
          if(!groups[date]) groups[date] = 0
          groups[date]++
      })
      // Tomamos las primeras 4 fechas únicas para mostrar en el timeline
      return Object.keys(groups).sort().slice(0, 4).map(date => ({
          date,
          count: groups[date]
      }))
  }, [filteredReceipts])

  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  // --- ESTILOS ---
  const containerStyle = { maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color:'#334155' }
  const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom:'30px' }
  const labelStyle = { display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px', color:'#64748b' }
  const inputStyle = { width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #e2e8f0', fontSize:'14px' }
  const btnStyle = { padding:'10px 20px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }

  if (loading) return <div style={{padding:'40px', color:'#64748b'}}>Cargando tablero...</div>

  return (
    <div style={containerStyle}>
      
      <h2 style={{color:'#0f172a', marginBottom:'20px'}}>Tablero de Control de Recibos</h2>

      {/* 1. SECCIÓN DE FILTROS */}
      <div style={cardStyle}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', alignItems:'end'}}>
              
              <div>
                  <label style={labelStyle}>Fecha de cobro</label>
                  <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} style={inputStyle} />
              </div>

              <div>
                  <label style={labelStyle}>Buscar póliza o cliente</label>
                  <input type="text" placeholder="Ej. 15025..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} style={inputStyle} />
              </div>

              <div>
                  <label style={labelStyle}>Buscar por estatus</label>
                  <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} style={inputStyle}>
                      <option>Todos</option>
                      <option>Vencido</option>
                      <option>Por Vencer</option>
                  </select>
              </div>

              <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={handleFilter} style={{...btnStyle, background:'#000080', color:'white'}}>BUSCAR</button>
                  <button onClick={clearFilters} style={{...btnStyle, background:'transparent', color:'#000080', display:'flex', alignItems:'center', gap:'5px'}}>
                      ✕ LIMPIAR FILTROS
                  </button>
              </div>
          </div>
      </div>

      {/* 2. LÍNEA DE TIEMPO (TIMELINE) */}
      <div style={{marginBottom:'30px'}}>
          <h3 style={{color:'#475569', marginBottom:'15px'}}>Calendario de recibos próximos a vencer</h3>
          
          {timelineData.length === 0 ? (
              <p style={{color:'#94a3b8', fontStyle:'italic'}}>No hay datos para mostrar en la línea de tiempo.</p>
          ) : (
            <div style={{position:'relative', padding:'40px 0'}}>
                {/* La línea gris de fondo */}
                <div style={{position:'absolute', top:'50%', left:'5%', right:'5%', height:'8px', background:'#e2e8f0', borderRadius:'4px', zIndex:0}}></div>
                
                <div style={{display:'flex', justifyContent:'space-between', position:'relative', zIndex:1, padding:'0 5%'}}>
                    {timelineData.map((item, index) => {
                        // Colores alternados para los puntos estilo pastel
                        const colors = ['#fca5a5', '#fde047', '#86efac', '#a5b4fc']
                        const color = colors[index % colors.length]
                        
                        return (
                            <div key={index} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                                <div style={{fontSize:'12px', fontWeight:'bold', color:'#334155', marginBottom:'5px'}}>
                                    {item.date}
                                </div>
                                <div style={{fontSize:'10px', color:'#64748b', marginBottom:'10px'}}>
                                    ({item.count} recibos)
                                </div>
                                {/* El Pin/Punto */}
                                <div style={{
                                    width:'20px', height:'20px', background:color, borderRadius:'50%', 
                                    border:'4px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'
                                }}></div>
                                <div style={{fontSize:'10px', color:'#64748b', marginTop:'10px'}}>
                                    Vencen {item.count} pólizas
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          )}
      </div>

      {/* 3. TABLA DE DETALLES */}
      <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <h3 style={{margin:0, color:'#0f172a'}}>Detalle de Recibos</h3>
          </div>

          <div style={{background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                  <thead>
                      <tr style={{background:'#1e1b4b', color:'white', textAlign:'left'}}>
                          <th style={{padding:'15px'}}>Póliza</th>
                          <th style={{padding:'15px'}}>Aseguradora</th>
                          <th style={{padding:'15px'}}>Cliente</th>
                          <th style={{padding:'15px'}}>Teléfono</th>
                          <th style={{padding:'15px'}}>Fecha de Cobro</th>
                          <th style={{padding:'15px'}}>Monto</th>
                          <th style={{padding:'15px'}}>Estatus</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredReceipts.length === 0 ? (
                          <tr><td colSpan="7" style={{padding:'30px', textAlign:'center', color:'#94a3b8'}}>No se encontraron recibos con los filtros actuales.</td></tr>
                      ) : (
                          filteredReceipts.map((item, i) => (
                              <tr key={i} style={{borderBottom:'1px solid #f1f5f9', background: i%2===0 ? 'white' : '#f8fafc'}}>
                                  <td style={{padding:'15px', fontWeight:'bold', color:'#334155'}}>{item.numero_poliza}</td>
                                  <td style={{padding:'15px'}}>{item.aseguradora}</td>
                                  <td style={{padding:'15px', textTransform:'uppercase'}}>
                                      {item.clientes?.nombre} {item.clientes?.apellido}
                                  </td>
                                  <td style={{padding:'15px'}}>{item.clientes?.telefono || '-'}</td>
                                  <td style={{padding:'15px'}}>{item.recibo_inicio}</td>
                                  <td style={{padding:'15px', fontWeight:'bold'}}>{money(item.prima_total)}</td>
                                  <td style={{padding:'15px'}}>
                                      <span style={{
                                          background: item.status === 'Vencido' ? '#ef4444' : '#f59e0b',
                                          color: 'white',
                                          padding: '4px 10px',
                                          borderRadius: '6px',
                                          fontWeight: 'bold',
                                          fontSize: '11px',
                                          display: 'inline-block',
                                          textAlign: 'center',
                                          width: '90px'
                                      }}>
                                          {item.status === 'Vencido' ? 'VENCIDO' : 'POR VENCER'}
                                      </span>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  )
}