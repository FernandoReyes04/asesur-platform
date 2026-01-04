import { useState, useEffect } from 'react'

export default function PolicyList() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true) // Inicia cargando

  // 1. LÓGICA PURA DE DATOS (Sin tocar estados de loading aquí)
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

  // 2. EFECTO INICIAL (Solo monta y apaga el loading al final)
  useEffect(() => {
    fetchPoliciesData().then(data => {
        setPolicies(data)
        setLoading(false)
    })
  }, [])

  // 3. FUNCIÓN PARA EL BOTÓN (Aquí sí activamos el loading manualmente)
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
          handleRefresh() // Recargamos usando la función del botón
      } catch (error) { alert(error.message) }
  }

  const getStatusStyle = (estado) => {
      switch(estado) {
          case 'pagado': return { bg: '#dcfce7', text: '#166534', label: 'PAGADO' }
          case 'vencido': return { bg: '#fee2e2', text: '#991b1b', label: 'VENCIDO' }
          default: return { bg: '#fef9c3', text: '#854d0e', label: 'PENDIENTE' }
      }
  }

  // ESTILOS
  const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{color:'#0f172a', marginBottom:'20px'}}>Cartera de Pólizas</h2>
        
        <div style={cardStyle}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h3 style={{margin:0, color:'#0f172a'}}>Seguimiento de Recibos</h3>
                {/* Usamos handleRefresh aquí */}
                <button onClick={handleRefresh} style={{background:'transparent', border:'1px solid #cbd5e1', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>🔄 Actualizar</button>
            </div>
            
            {loading ? <p style={{color:'#64748b'}}>Cargando cartera...</p> : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                    <thead>
                        <tr style={{textAlign:'left', color:'#64748b', borderBottom:'2px solid #f1f5f9'}}>
                            <th style={{padding:'10px'}}>Cliente</th>
                            <th>Póliza</th>
                            <th>Vigencia Recibo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {policies.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>No hay pólizas registradas.</td></tr> : 
                        policies.map(p => {
                            const statusStyle = getStatusStyle(p.estado)
                            return (
                                <tr key={p.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                                    <td style={{padding:'15px'}}>
                                        <div style={{fontWeight:'bold'}}>{p.clientes?.nombre} {p.clientes?.apellido}</div>
                                        <div style={{fontSize:'11px', color:'#64748b'}}>{p.clientes?.telefono || '-'}</div>
                                    </td>
                                    <td>
                                        <div style={{fontWeight:'bold', color:'#334155'}}>{p.aseguradora}</div>
                                        <div style={{fontSize:'11px', color:'#64748b'}}>{p.numero_poliza}</div>
                                    </td>
                                    <td>
                                        <div style={{color: p.estado === 'vencido' ? '#ef4444' : '#334155', fontWeight:'bold'}}>
                                            Del: {p.recibo_inicio}
                                        </div>
                                        <div style={{fontSize:'11px', color:'#94a3b8'}}>Al: {p.recibo_fin}</div>
                                    </td>
                                    <td style={{fontWeight:'bold'}}>${p.prima_total}</td>
                                    <td>
                                        <span style={{background: statusStyle.bg, color: statusStyle.text, padding:'4px 10px', borderRadius:'12px', fontSize:'10px', fontWeight:'bold', textTransform:'uppercase'}}>
                                            {statusStyle.label}
                                        </span>
                                    </td>
                                    <td>
                                        {p.estado !== 'pagado' && (
                                            <button onClick={()=>markAsPaid(p.id)} style={{background:'#22c55e', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'11px', fontWeight:'bold'}}>
                                                $$ PAGAR
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })
                        }
                    </tbody>
                </table>
            )}
        </div>
    </div>
  )
}