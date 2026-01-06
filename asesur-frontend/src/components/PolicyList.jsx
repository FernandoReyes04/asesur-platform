import { useState, useEffect } from 'react'
import '../styles/PolicyList.css'

export default function PolicyList() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  // ... (fetchPoliciesData, handleRefresh, markAsPaid, markAsCancelled IGUALES) ...
  const fetchPoliciesData = async () => {
    try {
        const res = await fetch('/api/polizas')
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch (error) { console.error(error); return [] }
  }

  useEffect(() => {
    fetchPoliciesData().then(data => { setPolicies(data); setLoading(false) })
  }, [])

  const handleRefresh = async () => {
    setLoading(true); const data = await fetchPoliciesData(); setPolicies(data); setLoading(false)
  }

  const markAsPaid = async (id) => {
      if(!confirm("¿Confirmar PAGO?")) return
      try { await fetch(`/api/polizas/${id}/pagar`, { method: 'PUT' }); handleRefresh() } catch (e) { alert(e.message) }
  }
  
  const markAsCancelled = async (id) => {
      if(!confirm("¿Confirmar CANCELACIÓN?")) return
      try { await fetch(`/api/polizas/${id}/cancelar`, { method: 'PUT' }); handleRefresh() } catch (e) { alert(e.message) }
  }

  // --- LÓGICA VISUAL ---
  const getStatusInfo = (poliza) => {
      if (poliza.estado === 'pagado') return { label: 'PAGADO', class: 'status-paid' }
      if (poliza.estado === 'cancelada') return { label: 'CANCELADA', class: 'status-cancelled' }
      if (poliza.estado === 'vencido') return { label: 'VENCIDO', class: 'status-expired' }

      // Si es PENDIENTE, verificamos qué tan cerca está del final
      const today = new Date()
      const fin = new Date(poliza.recibo_fin)
      const diffTime = fin - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 0) return { label: 'VENCIDO', class: 'status-expired' } // Por seguridad visual
      if (diffDays <= 15) return { label: `VENCE EN ${diffDays} DÍAS`, class: 'status-warning' } // Naranja
      
      return { label: 'VIGENTE', class: 'status-pending' } // Verde/Gris
  }

  return (
    <div className="policy-list-container">
        <h2 className="page-title">Cartera de Pólizas</h2>
        <div className="list-card">
            <div className="list-header">
                <h3 className="card-title">Seguimiento de Recibos</h3>
                <button onClick={handleRefresh} className="refresh-btn">Actualizar</button>
            </div>
            
            {loading ? <p className="loading-text">Cargando...</p> : (
                <table className="policy-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Póliza</th>
                            <th>Vendedor</th>
                            <th>Vigencia Recibo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {policies.map(p => {
                            const statusInfo = getStatusInfo(p)
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div className="client-name">{p.clientes?.nombre} {p.clientes?.apellido}</div>
                                    </td>
                                    <td>
                                        <div className="insurer-name">{p.aseguradora}</div>
                                        <div className="policy-number">{p.numero_poliza}</div>
                                        <div style={{fontSize:'10px', color:'#64748b'}}>{p.tipo_poliza}</div>
                                    </td>
                                    <td style={{fontSize:'12px'}}>{p.vendedor || 'Oficina'}</td>
                                    <td>
                                        <div className="date-start">Del: {p.recibo_inicio}</div>
                                        {/* Resaltamos la fecha importante: el FIN */}
                                        <div className="date-end" style={{fontWeight:'bold', color: statusInfo.class === 'status-warning' ? '#d97706' : '#334155'}}>
                                            Al: {p.recibo_fin}
                                        </div>
                                    </td>
                                    <td className="amount">${p.prima_total}</td>
                                    <td>
                                        <span className={`status-badge ${statusInfo.class}`}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                            {p.estado !== 'pagado' && p.estado !== 'cancelada' && (
                                                <>
                                                 <button onClick={()=>markAsPaid(p.id)} className="pay-btn">$$ PAGAR</button>
                                                 <button onClick={()=>markAsCancelled(p.id)} className="cancel-btn">✕ CANCELAR</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  )
}