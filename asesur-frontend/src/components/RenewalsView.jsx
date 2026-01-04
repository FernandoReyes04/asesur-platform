import { useEffect, useState, useMemo } from 'react'

export default function RenewalsView() {
  const [allRenewals, setAllRenewals] = useState([])
  const [filteredRenewals, setFilteredRenewals] = useState([])
  const [loading, setLoading] = useState(true)

  // --- NUEVO ESTADO: CONTROL DEL PANEL LATERAL ---
  const [showPanel, setShowPanel] = useState(true)

  // --- FILTROS ---
  const [filterDate, setFilterDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')

  useEffect(() => {
    fetch('http://localhost:3000/api/renovaciones')
      .then(res => res.json())
      .then(result => {
        const upcoming = (result.upcoming || []).map(i => ({ ...i, status: 'Por Renovar' }))
        const expired = (result.expired || []).map(i => ({ ...i, status: 'Vencida' }))
        
        const combined = [...expired, ...upcoming].sort((a,b) => new Date(a.poliza_fin) - new Date(b.poliza_fin))
        
        setAllRenewals(combined)
        setFilteredRenewals(combined)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // --- NUEVO: CÁLCULO DE ESTADÍSTICAS PARA EL PANEL ---
  const renewalStats = useMemo(() => {
      const stats = { total60: 0, days7: 0, days15: 0, days30: 0, days60: 0, cancelled: 0 }
      const today = new Date();
      today.setHours(0,0,0,0);

      allRenewals.forEach(item => {
          if(item.status === 'Por Renovar') {
              const end = new Date(item.poliza_fin);
              end.setHours(0,0,0,0);
              const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

              if (diffDays >= 0 && diffDays <= 60) stats.total60++;
              if (diffDays >= 0 && diffDays <= 7) stats.days7++;
              if (diffDays >= 0 && diffDays <= 15) stats.days15++;
              if (diffDays >= 0 && diffDays <= 30) stats.days30++;
              if (diffDays >= 0 && diffDays <= 60) stats.days60++;
          }
      });
      return stats;
  }, [allRenewals]);

  // --- LÓGICA DE FILTRADO ---
  const handleFilter = () => {
    let result = allRenewals

    if (filterDate) result = result.filter(item => item.poliza_fin === filterDate)

    if (searchTerm) {
        const term = searchTerm.toLowerCase()
        result = result.filter(item => 
            item.numero_poliza.toLowerCase().includes(term) ||
            item.aseguradora.toLowerCase().includes(term) ||
            item.clientes?.nombre?.toLowerCase().includes(term) ||
            item.clientes?.apellido?.toLowerCase().includes(term)
        )
    }

    if (filterStatus !== 'Todos') result = result.filter(item => item.status === filterStatus)

    setFilteredRenewals(result)
  }

  const clearFilters = () => {
      setFilterDate('')
      setSearchTerm('')
      setFilterStatus('Todos')
      setFilteredRenewals(allRenewals)
  }

  // --- LÓGICA TIMELINE ---
  const timelineData = useMemo(() => {
      const groups = {}
      filteredRenewals.forEach(item => {
          if(item.status === 'Por Renovar') {
            const date = item.poliza_fin
            if(!groups[date]) groups[date] = 0
            groups[date]++
          }
      })
      return Object.keys(groups).sort().slice(0, 4).map(date => ({ date, count: groups[date] }))
  }, [filteredRenewals])

  // --- ESTILOS ---
  const containerStyle = { maxWidth: '100%', margin: '0 auto', fontFamily: 'sans-serif', color:'#334155' }
  const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom:'30px' }
  const labelStyle = { display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px', color:'#64748b' }
  const inputStyle = { width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #e2e8f0', fontSize:'14px', boxSizing: 'border-box' }
  const btnStyle = { padding:'10px 20px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }

  // Estilos del Panel Lateral
  const sidePanelStyle = {
      width: '320px', background: 'white', padding: '25px', borderRadius: '12px', 
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginLeft: '20px', height: 'fit-content',
      transition: 'all 0.3s ease'
  }
  const iconCircle = (color) => ({
      width: '35px', height: '35px', borderRadius: '50%', background: color, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px'
  })
  const statRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }

  if (loading) return <div style={{padding:'40px', color:'#64748b'}}>Cargando renovaciones...</div>

  return (
    <div style={containerStyle}>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{color:'#0f172a', margin:0}}>Tablero de Próximas Renovaciones</h2>
          <button 
            onClick={() => setShowPanel(!showPanel)}
            style={{background:'white', border:'1px solid #cbd5e1', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', color:'#64748b', fontSize:'12px', fontWeight:'bold'}}
          >
            {showPanel ? 'Ocultar Panel' : 'Ver panel'}
          </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'start' }}>
          
          {/* --- CONTENIDO PRINCIPAL (IZQUIERDA) --- */}
          <div style={{ flex: 1 }}>
              
              {/* 1. FILTROS */}
              <div style={cardStyle}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', alignItems:'end'}}>
                      <div>
                          <label style={labelStyle}>Fecha fin de vigencia</label>
                          <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                          <label style={labelStyle}>Buscar póliza o cliente</label>
                          <input type="text" placeholder="Ej. Juan Pérez..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                          <label style={labelStyle}>Estatus</label>
                          <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} style={inputStyle}>
                              <option>Todos</option>
                              <option>Por Renovar</option>
                              <option>Vencida</option>
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

              {/* 2. TIMELINE */}
              <div style={{marginBottom:'30px'}}>
                  <h3 style={{color:'#475569', marginBottom:'15px'}}>Calendario de pólizas próximas a renovar</h3>
                  {timelineData.length === 0 ? (
                      <p style={{color:'#94a3b8', fontStyle:'italic'}}>No hay renovaciones programadas para las próximas fechas.</p>
                  ) : (
                    <div style={{position:'relative', padding:'40px 0'}}>
                        <div style={{position:'absolute', top:'50%', left:'5%', right:'5%', height:'8px', background:'#e2e8f0', borderRadius:'4px', zIndex:0}}></div>
                        <div style={{display:'flex', justifyContent:'space-between', position:'relative', zIndex:1, padding:'0 5%'}}>
                            {timelineData.map((item, index) => {
                                const colors = ['#f472b6', '#fbbf24', '#34d399', '#818cf8']
                                const color = colors[index % colors.length]
                                return (
                                    <div key={index} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                                        <div style={{fontSize:'12px', fontWeight:'bold', color:'#334155', marginBottom:'5px'}}>{item.date}</div>
                                        <div style={{fontSize:'10px', color:'#64748b', marginBottom:'10px'}}>(Vencen vigencia)</div>
                                        <div style={{width:'24px', height:'24px', background:color, borderRadius:'50%', border:'4px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}></div>
                                        <div style={{fontSize:'10px', color:'#64748b', marginTop:'10px', fontWeight:'bold'}}>{item.count} pólizas</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                  )}
              </div>

              {/* 3. TABLA DETALLE */}
              <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                      <h3 style={{margin:0, color:'#0f172a'}}>Detalle de Pólizas</h3>
                  </div>
                  <div style={{background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                          <thead>
                              <tr style={{background:'#1e1b4b', color:'white', textAlign:'left'}}>
                                  <th style={{padding:'15px'}}>Póliza</th>
                                  <th style={{padding:'15px'}}>Aseguradora</th>
                                  <th style={{padding:'15px'}}>Asegurado / Contratante</th>
                                  <th style={{padding:'15px'}}>Contacto</th>
                                  <th style={{padding:'15px'}}>Fecha Fin Vigencia</th>
                                  <th style={{padding:'15px'}}>Estatus</th>
                              </tr>
                          </thead>
                          <tbody>
                              {filteredRenewals.length === 0 ? (
                                  <tr><td colSpan="6" style={{padding:'30px', textAlign:'center', color:'#94a3b8'}}>No se encontraron pólizas.</td></tr>
                              ) : (
                                  filteredRenewals.map((item, i) => (
                                      <tr key={i} style={{borderBottom:'1px solid #f1f5f9', background: i%2===0 ? 'white' : '#f8fafc'}}>
                                          <td style={{padding:'15px', fontWeight:'bold', color:'#334155'}}>{item.numero_poliza}</td>
                                          <td style={{padding:'15px'}}>{item.aseguradora}</td>
                                          <td style={{padding:'15px', textTransform:'uppercase'}}>{item.clientes?.nombre} {item.clientes?.apellido}</td>
                                          <td style={{padding:'15px'}}>
                                              <div>Tel: {item.clientes?.telefono || '-'}</div>
                                              <div style={{fontSize:'11px', color:'#64748b'}}>{item.clientes?.email}</div>
                                          </td>
                                          <td style={{padding:'15px', fontWeight:'bold'}}>{item.poliza_fin}</td>
                                          <td style={{padding:'15px'}}>
                                              <span style={{
                                                  background: item.status === 'Vencida' ? '#fecaca' : '#fef08a',
                                                  color: item.status === 'Vencida' ? '#991b1b' : '#854d0e',
                                                  padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px',
                                                  display: 'inline-block', textAlign: 'center', width: '100px'
                                              }}>
                                                  {item.status === 'Vencida' ? 'NO VIGENTE' : 'POR RENOVAR'}
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

          {/* --- PANEL LATERAL DERECHO (DESPLEGABLE) --- */}
          {showPanel && (
              <div style={sidePanelStyle}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0, color:'#1e1b4b', fontSize:'16px'}}>Resumen</h3>
                      <button onClick={()=>setShowPanel(false)} style={{border:'none', background:'transparent', color:'#94a3b8', cursor:'pointer'}}>✕</button>
                  </div>

                  {/* Resumen Total */}
                  <div style={{background:'#f3f4f6', padding:'15px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'15px', marginBottom:'30px'}}>
                      <div style={{fontSize:'24px', fontWeight:'bold', color:'#1f2937'}}>{renewalStats.total60}</div>
                      <div style={{fontSize:'11px', color:'#6b7280', lineHeight:'1.3'}}>
                          Pólizas por vencer en los siguientes 60 días.
                      </div>
                  </div>

                  <h4 style={{fontSize:'13px', color:'#374151', marginBottom:'20px'}}>Pólizas por periodo</h4>

                  <div style={statRowStyle}>
                      <div><div style={{fontSize:'13px', color:'#64748b'}}>Siguientes 7 días</div><div style={{fontSize:'20px', fontWeight:'bold', color:'#0f172a'}}>{renewalStats.days7}</div></div>
                      <div style={iconCircle('#fbbf24')}>⚠️</div>
                  </div>
                  <div style={statRowStyle}>
                      <div><div style={{fontSize:'13px', color:'#64748b'}}>Siguientes 15 días</div><div style={{fontSize:'20px', fontWeight:'bold', color:'#0f172a'}}>{renewalStats.days15}</div></div>
                      <div style={iconCircle('#f97316')}>📅</div>
                  </div>
                  <div style={statRowStyle}>
                      <div><div style={{fontSize:'13px', color:'#64748b'}}>Siguientes 30 días</div><div style={{fontSize:'20px', fontWeight:'bold', color:'#0f172a'}}>{renewalStats.days30}</div></div>
                      <div style={iconCircle('#3b82f6')}>📅</div>
                  </div>
                  <div style={statRowStyle}>
                      <div><div style={{fontSize:'13px', color:'#64748b'}}>Siguientes 60 días</div><div style={{fontSize:'20px', fontWeight:'bold', color:'#0f172a'}}>{renewalStats.days60}</div></div>
                      <div style={iconCircle('#1e1b4b')}>📅</div>
                  </div>
                  <div style={{...statRowStyle, borderBottom:'none'}}>
                      <div><div style={{fontSize:'13px', color:'#64748b'}}>Canceladas</div><div style={{fontSize:'20px', fontWeight:'bold', color:'#0f172a'}}>{renewalStats.cancelled}</div></div>
                      <div style={iconCircle('#be123c')}>🚫</div>
                  </div>
              </div>
          )}

      </div>
    </div>
  )
}