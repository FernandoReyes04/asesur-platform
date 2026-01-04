import { useEffect, useState, useMemo } from 'react'
import '../styles/NotificationsView.css' // <--- IMPORTAMOS CSS

export default function NotificationsView() {
  const [allReceipts, setAllReceipts] = useState([])
  const [filteredReceipts, setFilteredReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  // --- FILTROS ---
  const [filterDate, setFilterDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')

  useEffect(() => {
    fetch('http://localhost:3000/api/notificaciones')
      .then(res => res.json())
      .then(result => {
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

  // --- FILTRADO ---
  const handleFilter = () => {
    let result = allReceipts

    if (filterDate) {
        result = result.filter(item => item.recibo_inicio === filterDate)
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase()
        result = result.filter(item => 
            item.numero_poliza.toLowerCase().includes(term) ||
            item.aseguradora.toLowerCase().includes(term) ||
            item.clientes?.nombre?.toLowerCase().includes(term) ||
            item.clientes?.apellido?.toLowerCase().includes(term)
        )
    }

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

  // --- TIMELINE ---
  const timelineData = useMemo(() => {
      const groups = {}
      filteredReceipts.forEach(item => {
          const date = item.recibo_inicio
          if(!groups[date]) groups[date] = 0
          groups[date]++
      })
      return Object.keys(groups).sort().slice(0, 4).map(date => ({
          date,
          count: groups[date]
      }))
  }, [filteredReceipts])

  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  if (loading) return <div className="loading-container">Cargando tablero...</div>

  return (
    <div className="notifications-container">
      
      <h2 className="page-title">Tablero de Control de Recibos</h2>

      {/* 1. FILTROS */}
      <div className="filters-card">
          <div className="filters-grid">
              
              <div>
                  <label className="filter-label">Fecha de cobro</label>
                  <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} className="filter-input" />
              </div>

              <div>
                  <label className="filter-label">Buscar póliza o cliente</label>
                  <input type="text" placeholder="Ej. 15025..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="filter-input" />
              </div>

              <div>
                  <label className="filter-label">Buscar por estatus</label>
                  <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="filter-input">
                      <option>Todos</option>
                      <option>Vencido</option>
                      <option>Por Vencer</option>
                  </select>
              </div>

              <div className="filter-buttons">
                  <button onClick={handleFilter} className="btn-filter btn-search">BUSCAR</button>
                  <button onClick={clearFilters} className="btn-filter btn-clear">
                      ✕ LIMPIAR FILTROS
                  </button>
              </div>
          </div>
      </div>

      {/* 2. TIMELINE */}
      <div className="timeline-section">
          <h3 className="section-title">Calendario de recibos próximos a vencer</h3>
          
          {timelineData.length === 0 ? (
              <p className="empty-timeline">No hay datos para mostrar en la línea de tiempo.</p>
          ) : (
            <div className="timeline-container">
                <div className="timeline-line"></div>
                
                <div className="timeline-items">
                    {timelineData.map((item, index) => {
                        const colors = ['#fca5a5', '#fde047', '#86efac', '#a5b4fc']
                        const color = colors[index % colors.length]
                        
                        return (
                            <div key={index} className="timeline-item">
                                <div className="timeline-date">{item.date}</div>
                                <div className="timeline-count-label">({item.count} recibos)</div>
                                <div className="timeline-dot" style={{ background: color }}></div>
                                <div className="timeline-footer">Vencen {item.count} pólizas</div>
                            </div>
                        )
                    })}
                </div>
            </div>
          )}
      </div>

      {/* 3. TABLA */}
      <div>
          <div className="table-header-row">
              <h3 className="section-title" style={{margin:0, color:'#0f172a'}}>Detalle de Recibos</h3>
          </div>

          <div className="details-card">
              <table className="receipts-table">
                  <thead>
                      <tr>
                          <th>Póliza</th>
                          <th>Aseguradora</th>
                          <th>Cliente</th>
                          <th>Teléfono</th>
                          <th>Fecha de Cobro</th>
                          <th>Monto</th>
                          <th>Estatus</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredReceipts.length === 0 ? (
                          <tr><td colSpan="7" className="empty-message">No se encontraron recibos con los filtros actuales.</td></tr>
                      ) : (
                          filteredReceipts.map((item, i) => (
                              <tr key={i}>
                                  <td className="policy-cell">{item.numero_poliza}</td>
                                  <td>{item.aseguradora}</td>
                                  <td className="client-cell">
                                      {item.clientes?.nombre} {item.clientes?.apellido}
                                  </td>
                                  <td>{item.clientes?.telefono || '-'}</td>
                                  <td>{item.recibo_inicio}</td>
                                  <td className="amount-cell">{money(item.prima_total)}</td>
                                  <td>
                                      <span className={`status-badge ${item.status === 'Vencido' ? 'status-expired' : 'status-warning'}`}>
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