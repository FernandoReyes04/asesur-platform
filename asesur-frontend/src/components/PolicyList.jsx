import { useState, useEffect } from 'react'
import '../styles/PolicyList.css' // <--- IMPORTAMOS CSS

export default function PolicyList() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPoliciesData = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/polizas')
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch (error) { 
        console.error(error)
        return []
    }
  }

  useEffect(() => {
    fetchPoliciesData().then(data => {
        setPolicies(data)
        setLoading(false)
    })
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    const data = await fetchPoliciesData()
    setPolicies(data)
    setLoading(false)
  }

  const markAsPaid = async (id) => {
      if(!confirm("¿Confirmar que esta póliza ha sido PAGADA?")) return
      try {
          await fetch(`http://localhost:3000/api/polizas/${id}/pagar`, { method: 'PUT' })
          handleRefresh() 
      } catch (error) { alert(error.message) }
  }

  const getStatusClass = (estado) => {
      switch(estado) {
          case 'pagado': return 'status-badge status-paid'
          case 'vencido': return 'status-badge status-expired'
          default: return 'status-badge status-pending'
      }
  }

  const getStatusLabel = (estado) => {
      switch(estado) {
          case 'pagado': return 'PAGADO'
          case 'vencido': return 'VENCIDO'
          default: return 'PENDIENTE'
      }
  }

  return (
    <div className="policy-list-container">
        <h2 className="page-title">Cartera de Pólizas</h2>
        
        <div className="list-card">
            <div className="list-header">
                <h3 className="card-title">Seguimiento de Recibos</h3>
                <button onClick={handleRefresh} className="refresh-btn">🔄 Actualizar</button>
            </div>
            
            {loading ? <p className="loading-text">Cargando cartera...</p> : (
                <table className="policy-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Póliza</th>
                            <th>Vigencia Recibo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {policies.length === 0 ? (
                            <tr><td colSpan="6" className="empty-message">No hay pólizas registradas.</td></tr>
                        ) : (
                            policies.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="client-name">{p.clientes?.nombre} {p.clientes?.apellido}</div>
                                        <div className="client-phone">{p.clientes?.telefono || '-'}</div>
                                    </td>
                                    <td>
                                        <div className="insurer-name">{p.aseguradora}</div>
                                        <div className="policy-number">{p.numero_poliza}</div>
                                    </td>
                                    <td>
                                        <div className={`date-start ${p.estado === 'vencido' ? 'expired' : ''}`}>
                                            Del: {p.recibo_inicio}
                                        </div>
                                        <div className="date-end">Al: {p.recibo_fin}</div>
                                    </td>
                                    <td className="amount">${p.prima_total}</td>
                                    <td>
                                        <span className={getStatusClass(p.estado)}>
                                            {getStatusLabel(p.estado)}
                                        </span>
                                    </td>
                                    <td>
                                        {p.estado !== 'pagado' && (
                                            <button onClick={()=>markAsPaid(p.id)} className="pay-btn">
                                                $$ PAGAR
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  )
}