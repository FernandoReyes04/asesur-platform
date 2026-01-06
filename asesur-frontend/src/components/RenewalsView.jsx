import { useEffect, useState, useMemo } from 'react'
import GridSpinner from './GridSpinner'
import peligroIcon from '../icons/peligro.png';
import calendar2Icon from '../icons/calendario(1).png';
import canceledIcon from '../icons/cancelado.png';
import '../styles/RenewalsView.css'

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
    fetch('https://asesur-platform.onrender.com/api/polizas/renovaciones') // Asegúrate que la ruta en tu router coincida
      .then(res => res.json())
      .then(result => {
        // Mapeamos los estados basados en lo que envía el backend
        const upcoming = (result.upcoming || []).map(i => ({ ...i, status: 'Por Renovar' }))
        const expired = (result.expired || []).map(i => ({ ...i, status: 'Vencida' }))
        const cancelled = (result.cancelled || []).map(i => ({ ...i, status: 'Cancelada' })) // <--- NUEVO GRUPO
        
        // Unimos todo
        const combined = [...expired, ...upcoming, ...cancelled].sort((a,b) => new Date(a.poliza_fin) - new Date(b.poliza_fin))
        
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
          // 1. Contar Canceladas
          if(item.status === 'Cancelada') {
              stats.cancelled++;
          } 
          // 2. Contar Próximas (Solo si NO están canceladas)
          else if(item.status === 'Por Renovar') {
              const end = new Date(item.poliza_fin); // <--- VIGENCIA GENERAL
              end.setHours(0,0,0,0);
              // +1 para evitar errores de zona horaria al restar fechas puras
              const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

              if (diffDays >= 0 && diffDays <= 60) stats.total60++;
              
              if (diffDays >= 0 && diffDays <= 7) stats.days7++;
              else if (diffDays > 7 && diffDays <= 15) stats.days15++; // Else if para que sean exclusivos en el panel si quieres, o déjalos inclusivos
              else if (diffDays > 15 && diffDays <= 30) stats.days30++;
              else if (diffDays > 30 && diffDays <= 60) stats.days60++;

              // NOTA: Si prefieres acumulativos (ej. "en los próximos 30 días" incluye los de 7),
              // usa ifs simples como tenías antes. Aquí los hice exclusivos para el gráfico.
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

  // --- TIMELINE (Solo mostramos las vigentes por renovar) ---
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

  // --- HELPER DE ESTILOS ---
  const getStatusBadgeClass = (status) => {
      switch(status) {
          case 'Vencida': return 'status-expired';
          case 'Cancelada': return 'status-cancelled-badge'; // Necesitas agregar css
          default: return 'status-upcoming';
      }
  }

  if (loading) {
    return (
      <div style={{height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px'}}>
        <GridSpinner />
        <div style={{color:'#64748b', fontSize:'14px', fontWeight:'500'}}>Cargando panel...</div>
      </div>
    )
  }

  return (
    <div className="renewals-container">
      
      <div className="header-row">
          <h2 className="page-title">Tablero de Próximas Renovaciones</h2>
          <button onClick={() => setShowPanel(!showPanel)} className="toggle-panel-btn">
            {showPanel ? 'Ocultar Panel →' : '← Ver Panel'}
          </button>
      </div>

      <div className="main-layout">
          
          {/* --- CONTENIDO PRINCIPAL --- */}
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
                              <option>Cancelada</option> {/* <--- OPCIÓN NUEVA */}
                          </select>
                      </div>
                      <div className="filter-actions">
                          <button onClick={handleFilter} className="btn-search">BUSCAR</button>
                          <button onClick={clearFilters} className="btn-clear">✕ LIMPIAR</button>
                      </div>
                  </div>
              </div>

              {/* 2. TIMELINE */}
              <div className="timeline-section">
                  <h3 className="section-title">Calendario (Vigencia General)</h3>
                  {timelineData.length === 0 ? (
                      <p className="empty-timeline">No hay renovaciones próximas en cola.</p>
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
                                        <div className="point-label">(Fin Vigencia)</div>
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
                                  <th>Fin Vigencia General</th>
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
                                              <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                                                  {item.status === 'Vencida' ? 'NO VIGENTE' : item.status === 'Cancelada' ? 'CANCELADA' : 'POR RENOVAR'}
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

          {/* --- PANEL LATERAL DERECHO --- */}
          {showPanel && (
              <div className="side-panel">
                  <div className="panel-header">
                      <h3 className="panel-title">Resumen</h3>
                      <button onClick={()=>setShowPanel(false)} className="close-panel-btn">✕</button>
                  </div>

                  <div className="summary-box">
                      <div className="summary-number">{renewalStats.total60}</div>
                      <div className="summary-text">
                          Pólizas activas por vencer en los siguientes 60 días.
                      </div>
                  </div>

                  <h4 className="panel-subtitle">Desglose por tiempo</h4>

                  <div className="stat-row">
                      <div><div className="stat-label">Dentro de 7 diás</div><div className="stat-value">{renewalStats.days7}</div></div>
                      <div className="icon-circle" style={{background: '#fbbf24'}}>
                        <img src={peligroIcon} alt="Urgente" className="status-icon" /></div>
                  </div>
                  <div className="stat-row">
                      <div><div className="stat-label">Dentro de 15 días</div><div className="stat-value">{renewalStats.days15}</div></div>
                      <div className="icon-circle" style={{background: '#f97316'}}>
                        <img src={calendar2Icon} alt="Calendario" className="status-icon" /></div>
                  </div>
                  <div className="stat-row">
                      <div><div className="stat-label">Dentro de 30 días</div><div className="stat-value">{renewalStats.days30}</div></div>
                      <div className="icon-circle" style={{background: '#3b82f6'}}>
                        <img src={calendar2Icon} alt="Calendario" className="status-icon" /></div>
                  </div>
                  <div className="stat-row">
                      <div><div className="stat-label">Dentro de 60 días</div><div className="stat-value">{renewalStats.days60}</div></div>
                      <div className="icon-circle" style={{background: '#1e1b4b'}}>
                        <img src={calendar2Icon} alt="Calendario" className="status-icon" /></div>
                  </div>
                  
                  {/* AQUÍ SE REFLEJA EL RECUENTO DE CANCELADAS */}
                  <div className="stat-row last">
                      <div><div className="stat-label">Canceladas</div><div className="stat-value">{renewalStats.cancelled}</div></div>
                      <div className="icon-circle" style={{background: '#be123c'}}>
                        <img src={canceledIcon} alt="Canceladas" className="status-icon" /></div>
                  </div>
              </div>
          )}

      </div>
    </div>
  )
}