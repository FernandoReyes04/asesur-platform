import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import '../styles/HistoryMetricsView.css' // <--- IMPORTAMOS CSS

export default function HistoryMetricsView({ onBack }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // --- FILTROS ---
  const [year, setYear] = useState(new Date().getFullYear())
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

  // --- LÓGICA SELECCIÓN ---
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
  const clearSelection = () => setSelectedMonths([]) 

  // --- FILTRADO ---
  const filteredData = useMemo(() => {
      if (!metrics) return []
      return metrics.monthlyData.filter(m => {
          const [mYear, mMonth] = m.mes.split('-').map(Number)
          return mYear === year && selectedMonths.includes(mMonth)
      })
  }, [metrics, year, selectedMonths])

  // --- RESUMEN ---
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

  if (loading) return <div className="loading-view">Cargando historial...</div>

  return (
    <div className="history-container">
      
      {/* HEADER */}
      <div className="history-header">
          <button onClick={onBack} className="back-btn">←</button>
          <div>
              <h2 className="history-title">Historial y Comparativas</h2>
              <p className="history-subtitle">Selecciona los meses que deseas analizar.</p>
          </div>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="filters-bar">
          <div className="filters-top-row">
              <div className="year-selector-group">
                  <span className="filter-label">AÑO:</span>
                  <select value={year} onChange={e=>setYear(Number(e.target.value))} className="year-select">
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                  </select>
              </div>
              
              <div className="selection-actions">
                  <button onClick={selectAll} className="action-link select-all">Seleccionar Todo</button>
                  <button onClick={clearSelection} className="action-link clear">Limpiar</button>
              </div>
          </div>

          <div className="months-grid">
              {MONTHS_LABELS.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => toggleMonth(m.id)} 
                    className={`month-btn ${selectedMonths.includes(m.id) ? 'active' : 'inactive'}`}
                  >
                      {m.label}
                  </button>
              ))}
          </div>
      </div>

      {/* RESUMEN */}
      <div className="summary-grid">
          <div className="summary-card blue">
              <div className="summary-label">Venta (Meses Seleccionados)</div>
              <div className="summary-value">{money(periodSummary.total)}</div>
          </div>
          <div className="summary-card green">
              <div className="summary-label">Utilidad Neta</div>
              <div className="summary-value green-text">{money(periodSummary.neta)}</div>
          </div>
          <div className="summary-card orange">
              <div className="summary-label">Pólizas Colocadas</div>
              <div className="summary-value orange-text">{periodSummary.count}</div>
          </div>
      </div>

      {/* GRÁFICAS COMPARATIVAS */}
      <div className="charts-layout">
          
          {/* 1. BARRAS */}
          <div className="chart-box">
              <h3 className="chart-title">📊 Comparativa Mensual</h3>
              <p className="chart-desc">
                  {selectedMonths.length > 1 ? 'Comparando rendimiento entre los meses seleccionados.' : 'Visualizando detalle del mes seleccionado.'}
              </p>
              
              {filteredData.length > 0 ? (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
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
                  </div>
              ) : (
                  <div className="no-data-placeholder">
                      Selecciona al menos un mes con datos.
                  </div>
              )}
          </div>

          {/* 2. PASTEL */}
          <div className="chart-box">
              <h3 className="chart-title">🍰 Share Acumulado</h3>
              <p className="chart-desc">Distribución total en la selección.</p>
              
              {periodPieData.length > 0 ? (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={periodPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {periodPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => money(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                  </div>
              ) : (
                  <div className="no-data-placeholder">
                      Sin datos.
                  </div>
              )}
          </div>

      </div>
    </div>
  )
}