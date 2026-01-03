import { useState, useEffect } from 'react'

export default function PolicyManagement() {
  const [activeTab, setActiveTab] = useState('list')
  
  // ESTADOS FORMULARIO
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsList, setClientsList] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)

  // ESTADOS LISTADO
  const [policies, setPolicies] = useState([])

  // DATOS NUEVOS
  const [policyData, setPolicyData] = useState({
    numero_poliza: '', 
    numero_recibo: '', 
    aseguradora: 'Banorte',
    forma_pago: 'Anual', 
    prima_neta: '', 
    prima_total: '',
    // FECHAS NUEVAS
    poliza_inicio: '', 
    poliza_fin: '',
    recibo_inicio: '', 
    recibo_fin: ''
  })

  // CARGAR PÓLIZAS
  useEffect(() => {
    if (activeTab === 'list') fetchPolicies()
  }, [activeTab])

  const fetchPolicies = async () => {
    setLoading(true)
    try {
        const res = await fetch('http://localhost:3000/api/polizas')
        const data = await res.json()
        setPolicies(data)
    } catch (error) { console.error(error) }
    setLoading(false)
  }

  // --- LÓGICA DE MONEDA ---
  const formatCurrency = (value) => {
    if (!value) return ''
    const number = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    if (isNaN(number)) return ''
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number)
  }
  const handleMoneyBlur = (e, field) => { setPolicyData({ ...policyData, [field]: formatCurrency(e.target.value) }) }
  const handleMoneyFocus = (e, field) => { const val = e.target.value.replace(/[^0-9.]/g, ''); setPolicyData({ ...policyData, [field]: val }) }

  // --- API CLIENTES ---
  const handleSearch = async (term) => {
    setSearchTerm(term); if (term.length < 3) return
    try { const res = await fetch(`http://localhost:3000/api/clientes/search?q=${term}`); const data = await res.json(); setClientsList(data) } catch (e) { console.error(e) }
  }
  const handleSelectClient = (c) => { setSelectedClient(c); setClientsList([]); setSearchTerm('') }

  // --- REGISTRAR ---
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!selectedClient) return alert("⚠️ Selecciona cliente")
    setLoading(true)
    try {
      const cleanPrimaNeta = parseFloat(policyData.prima_neta.toString().replace(/[^0-9.]/g, ''))
      const cleanPrimaTotal = parseFloat(policyData.prima_total.toString().replace(/[^0-9.]/g, ''))
      
      const payload = { ...policyData, prima_neta: cleanPrimaNeta, prima_total: cleanPrimaTotal, cliente_id: selectedClient.id }

      const res = await fetch('http://localhost:3000/api/polizas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Error registrando")
      
      alert("✅ Póliza registrada"); 
      // Limpiar formulario
      setPolicyData({ ...policyData, numero_poliza:'', numero_recibo:'', prima_neta:'', prima_total:'' })
      setActiveTab('list') 
    } catch (e) { alert(e.message) } finally { setLoading(false) }
  }

  const markAsPaid = async (id) => {
      if(!confirm("¿Confirmar pago?")) return
      try {
          await fetch(`http://localhost:3000/api/polizas/${id}/pagar`, { method: 'PUT' })
          fetchPolicies() 
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
  const containerStyle = { maxWidth: '1000px', margin: '0 auto' }
  const tabBtnStyle = (isActive) => ({
      padding: '10px 20px', cursor: 'pointer', border: 'none', background: isActive ? '#0f172a' : 'white', color: isActive ? 'white' : '#64748b', borderRadius: '8px', fontWeight: 'bold', marginRight:'10px', boxShadow: isActive ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
  })
  const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }
  const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }
  const labelStyle = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display:'block', fontWeight:'bold' }

  return (
    <div style={containerStyle}>
      
      <div style={{marginBottom:'20px', display:'flex', alignItems:'center'}}>
          <button onClick={()=>setActiveTab('list')} style={tabBtnStyle(activeTab==='list')}>📋 Cartera</button>
          <button onClick={()=>setActiveTab('form')} style={tabBtnStyle(activeTab==='form')}>➕ Nueva Póliza</button>
      </div>

      {/* --- VISTA 1: LISTADO --- */}
      {activeTab === 'list' && (
          <div style={cardStyle}>
              <h3 style={{marginTop:0, color:'#0f172a'}}>Seguimiento de Recibos</h3>
              {loading ? <p>Cargando...</p> : (
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                      <thead>
                          <tr style={{textAlign:'left', color:'#64748b', borderBottom:'2px solid #f1f5f9'}}>
                              <th style={{padding:'10px'}}>Cliente</th>
                              <th>Póliza</th>
                              <th>Vigencia Recibo</th>
                              <th>Monto</th>
                              <th>Estado</th>
                              <th></th>
                          </tr>
                      </thead>
                      <tbody>
                          {policies.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>Sin registros.</td></tr> : 
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
                                                  $$
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
      )}

      {/* --- VISTA 2: FORMULARIO --- */}
      {activeTab === 'form' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            <div style={{...cardStyle, height:'fit-content'}}>
                <h3 style={{marginTop:0, color:'#0f172a'}}>1. Cliente</h3>
                <input type="text" placeholder="🔍 Buscar..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} style={{...inputStyle, marginBottom:'10px'}} />
                <div style={{maxHeight:'200px', overflowY:'auto'}}>
                {clientsList.map(c => (
                    <div key={c.id} onClick={() => handleSelectClient(c)} style={{padding:'10px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', background:'#f8fafc', marginBottom:'5px'}}>
                    <div style={{fontWeight:'bold'}}>{c.nombre} {c.apellido}</div>
                    </div>
                ))}
                </div>
                {selectedClient && <div style={{marginTop:'10px', padding:'10px', background:'#eff6ff', borderRadius:'8px', border:'1px solid #bfdbfe', fontSize:'13px'}}>
                    <div style={{fontWeight:'bold', color:'#1e3a8a'}}>👤 {selectedClient.nombre} {selectedClient.apellido}</div>
                </div>}
            </div>

            <div style={{...cardStyle, opacity: selectedClient ? 1 : 0.5, pointerEvents: selectedClient ? 'all' : 'none'}}>
                <h3 style={{marginTop:0, color:'#0f172a'}}>2. Póliza y Recibo</h3>
                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                    <div>
                        <label style={labelStyle}>Aseguradora</label>
                        <select value={policyData.aseguradora} onChange={e => setPolicyData({...policyData, aseguradora:e.target.value})} style={inputStyle}>
                        <option>Banorte</option><option>Atlas</option><option>Qualitas</option><option>Inbursa</option><option>General de Seguros</option><option>Latino</option><option>HDI</option><option>Axa</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Forma Pago</label>
                        <select value={policyData.forma_pago} onChange={e => setPolicyData({...policyData, forma_pago:e.target.value})} style={inputStyle}>
                            <option>Mensual</option><option>Bimestral</option><option>Semestral</option><option>Trimestral</option><option>Cuatrimestral</option><option>Anual</option>
                        </select>
                    </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                    <div><label style={labelStyle}>No. Póliza</label><input type="text" required value={policyData.numero_poliza} onChange={e => setPolicyData({...policyData, numero_poliza:e.target.value})} style={inputStyle} /></div>
                    <div><label style={labelStyle}>No. Recibo</label><input type="text" required value={policyData.numero_recibo} onChange={e => setPolicyData({...policyData, numero_recibo:e.target.value})} style={inputStyle} /></div>
                </div>

                {/* VIGENCIA PÓLIZA */}
                <div style={{border:'1px solid #e2e8f0', padding:'10px', borderRadius:'8px', background:'#f8fafc'}}>
                    <label style={{...labelStyle, color:'#0f172a', marginBottom:'8px'}}>📅 Vigencia General de Póliza</label>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div><label style={{fontSize:'10px'}}>Inicio</label><input type="date" required value={policyData.poliza_inicio} onChange={e => setPolicyData({...policyData, poliza_inicio:e.target.value})} style={inputStyle} /></div>
                        <div><label style={{fontSize:'10px'}}>Fin</label><input type="date" required value={policyData.poliza_fin} onChange={e => setPolicyData({...policyData, poliza_fin:e.target.value})} style={inputStyle} /></div>
                    </div>
                </div>

                {/* VIGENCIA RECIBO */}
                <div style={{border:'1px solid #fed7aa', padding:'10px', borderRadius:'8px', background:'#fff7ed'}}>
                    <label style={{...labelStyle, color:'#c2410c', marginBottom:'8px'}}>🧾 Cobertura del Recibo (Pago)</label>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div><label style={{fontSize:'10px'}}>Desde</label><input type="date" required value={policyData.recibo_inicio} onChange={e => setPolicyData({...policyData, recibo_inicio:e.target.value})} style={inputStyle} /></div>
                        <div><label style={{fontSize:'10px'}}>Hasta</label><input type="date" required value={policyData.recibo_fin} onChange={e => setPolicyData({...policyData, recibo_fin:e.target.value})} style={inputStyle} /></div>
                    </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                    <div><label style={labelStyle}>Prima Neta</label><input type="text" required placeholder="$0.00" value={policyData.prima_neta} onChange={e => setPolicyData({...policyData, prima_neta:e.target.value})} onBlur={(e) => handleMoneyBlur(e, 'prima_neta')} onFocus={(e) => handleMoneyFocus(e, 'prima_neta')} style={{...inputStyle, fontWeight:'bold'}} /></div>
                    <div><label style={labelStyle}>Prima Total</label><input type="text" required placeholder="$0.00" value={policyData.prima_total} onChange={e => setPolicyData({...policyData, prima_total:e.target.value})} onBlur={(e) => handleMoneyBlur(e, 'prima_total')} onFocus={(e) => handleMoneyFocus(e, 'prima_total')} style={{...inputStyle, fontWeight:'bold'}} /></div>
                </div>

                <button disabled={loading} style={{padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', marginTop:'10px'}}>{loading ? '...' : 'Registrar'}</button>
                </form>
            </div>
          </div>
      )}
    </div>
  )
}