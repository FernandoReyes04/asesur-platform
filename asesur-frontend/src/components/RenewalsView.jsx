import { useEffect, useState, useMemo } from 'react'
import '../styles/RenewalsView.css' // <--- IMPORTAMOS CSS

export default function RenewalsView() {
  const [allRenewals, setAllRenewals] = useState([])
  const [filteredRenewals, setFilteredRenewals] = useState([])
  const [loading, setLoading] = useState(true)

  // --- ESTADO PANEL LATERAL ---
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

  // --- CÁLCULO ESTADÍSTICAS ---
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

  // --- FILTRADO ---
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

  // --- TIMELINE ---
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

  if (loading) return <div className="loading-text">Cargando renovaciones...</div>

  return (
    <div className="renewals-container">
      
      <div className="header-row">
          <h2 className="page-title">Tablero de Próximas Renovaciones</h2>
          <button onClick={() => setShowPanel(!showPanel)} className="toggle-panel-btn">
            {showPanel ? 'Ocultar Panel →' : '← Ver Estadísticas'}
          </button>
      </div>

      <div className="main-layout">
          
          {/* --- CONTENIDO PRINCIPAL (IZQUIERDA) --- */}
          <div className="content-area">
              
              {/* 1. FILTROS */}
              <div className="filters-card">
                  <div className="filters-grid">
                      <div>
                          <label className="filter-label">Fecha fin de vigencia</label>
                          <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} className="filter-input" />
                      </div>
                      <div>
                          <label className="filter-label">Buscar póliza o cliente</label>
                          <input type="text" placeholder="Ej. Juan Pérez..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="filter-input" />
                      </div>
                      <div>
                          <label className="filter-label">Estatus</label>
                          <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="filter-input">
                              <option>Todos</option>
                              <option>Por Renovar</option>
                              <option>Vencida</option>
                          </select>
                      </div>
                      <div className="filter-actions">
                          <button onClick={handleFilter} className="btn-search">BUSCAR</button>
                          <button onClick={clearFilters} className="btn-clear">
                              ✕ LIMPIAR
                          </button>
                      </div>
                  </div>
              </div>

              {/* 2. TIMELINE */}
              <div className="timeline-section">
                  <h3 className="section-title">Calendario de pólizas próximas a renovar</h3>
                  {timelineData.length === 0 ? (
                      <p className="empty-timeline">No hay renovaciones programadas para las próximas fechas.</p>
                  ) : (
                    <div className="timeline-container">
                        <div className="timeline-track"></div>
                        <div className="timeline-points">
                            {timelineData.map((item, index) => {
                                const colors = ['#f472b6', '#fbbf24', '#34d399', '#818cf8']
                                const color = colors[index % colors.length]
                                return (
                                    <div key={index} className="timeline-point">
                                        <div className="point-date">{item.date}</div>
                                        <div className="point-label">(Vence vigencia)</div>
                                        <div className="point-marker" style={{ background: color }}></div>
                                        <div className="point-count">{item.count} pólizas</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                  )}
              </div>

              {/* 3. TABLA DETALLE */}
              <div>
                  <div className="table-header">
                      <h3 className="section-title" style={{margin:0}}>Detalle de Pólizas</h3>
                  </div>
                  <div className="table-card">
                      <table className="renewals-table">
                          <thead>
                              <tr>
                                  <th>Póliza</th>
                                  <th>Aseguradora</th>
                                  <th>Asegurado / Contratante</th>
                                  <th>Contacto</th>
                                  <th>Fecha Fin Vigencia</th>
                                  <th>Estatus</th>
                              </tr>
                          </thead>
                          <tbody>
                              {filteredRenewals.length === 0 ? (
                                  <tr><td colSpan="6" className="empty-table">No se encontraron pólizas.</td></tr>
                              ) : (
                                  filteredRenewals.map((item, i) => (
                                      <tr key={i}>
                                          <td className="td-policy">{item.numero_poliza}</td>
                                          <td>{item.aseguradora}</td>
                                          <td className="td-client">{item.clientes?.nombre} {item.clientes?.apellido}</td>
                                          <td>
                                              <div>Tel: {item.clientes?.telefono || '-'}</div>
                                              <div className="td-contact-sub">{item.clientes?.email}</div>
                                          </td>
                                          <td className="td-date">{item.poliza_fin}</td>
                                          <td>
                                              <span className={`status-badge ${item.status === 'Vencida' ? 'status-expired' : 'status-upcoming'}`}>
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
              <div className="side-panel">
                  <div className="panel-header">
                      <h3 className="panel-title">Resumen</h3>
                      <button onClick={()=>setShowPanel(false)} className="close-panel-btn">✕</button>
                  </div>

                  {/* Resumen Total */}
                  <div className="summary-box">
                      <div className="summary-number">{renewalStats.total60}</div>
                      <div className="summary-text">
                          Pólizas por vencer en los siguientes 60 días.
                      </div>
                  </div>

                  <h4 className="panel-subtitle">Pólizas por periodo</h4>

                  <div className="stat-row">
                      <div><div className="stat-label">Siguientes 7 días</div><div className="stat-value">{renewalStats.days7}</div></div>
                      <div className="icon-circle" style={{background: '#fbbf24'}}>⚠️</div>
                  </div>
                  <div className="stat-row">
                      <div><div className="stat-label">Siguientes 15 días</div><div className="stat-value">{renewalStats.days15}</div></div>
                      <div className="icon-circle" style={{background: '#f97316'}}>📅</div>
                  </div>
                  <div className="stat-row">
                      <div><div className="stat-label">Siguientes 30 días</div><div className="stat-value">{renewalStats.days30}</div></div>
                      <div className="icon-circle" style={{background: '#3b82f6'}}>📅</div>
                  </div>
                  <div className="stat-row">
                      <div><div className="stat-label">Siguientes 60 días</div><div className="stat-value">{renewalStats.days60}</div></div>
                      <div className="icon-circle" style={{background: '#1e1b4b'}}>📅</div>
                  </div>
                  <div className="stat-row last">
                      <div><div className="stat-label">Canceladas</div><div className="stat-value">{renewalStats.cancelled}</div></div>
                      <div className="icon-circle" style={{background: '#be123c'}}>🚫</div>
                  </div>

                  <button className="download-btn">DESCARGAR PÓLIZAS ⬇</button>
              </div>
          )}

      </div>
    </div>
  )
}