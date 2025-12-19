import { useState } from 'react'

export default function PolicyManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsList, setClientsList] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)

  const [policyData, setPolicyData] = useState({
    numero_poliza: '', 
    numero_recibo: '', 
    fecha_vencimiento_recibo: '',
    recibo_inicio: '', 
    recibo_fin: '', 
    forma_pago: 'Anual', 
    prima_neta: '', 
    prima_total: '', 
    aseguradora: 'Banorte' // <--- Valor inicial actualizado
  })

  // --- LÓGICA DE MONEDA ---
  const formatCurrency = (value) => {
    if (!value) return ''
    const number = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    if (isNaN(number)) return ''
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number)
  }
  const handleMoneyBlur = (e, field) => { setPolicyData({ ...policyData, [field]: formatCurrency(e.target.value) }) }
  const handleMoneyFocus = (e, field) => { const val = e.target.value.replace(/[^0-9.]/g, ''); setPolicyData({ ...policyData, [field]: val }) }

  // --- API ---
  const handleSearch = async (term) => {
    setSearchTerm(term); if (term.length < 3) return
    try { const res = await fetch(`http://localhost:3000/api/clientes/search?q=${term}`); const data = await res.json(); setClientsList(data) } catch (e) { console.error(e) }
  }
  const handleSelectClient = (c) => { setSelectedClient(c); setClientsList([]); setSearchTerm('') }

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
      setPolicyData({ ...policyData, numero_poliza:'', numero_recibo:'', prima_neta:'', prima_total:'' }) // Limpiar campos clave
    } catch (e) { alert(e.message) } finally { setLoading(false) }
  }

  // Estilos
  const containerStyle = { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }
  const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }
  const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }
  const labelStyle = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display:'block', fontWeight:'bold' }

  return (
    <div style={containerStyle}>
      {/* IZQUIERDA */}
      <div style={{...cardStyle, height:'fit-content'}}>
        <h3 style={{marginTop:0, color:'#0f172a'}}>1. Seleccionar Cliente</h3>
        <input type="text" placeholder="🔍 Buscar..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} style={{...inputStyle, marginBottom:'10px'}} />
        <div style={{maxHeight:'300px', overflowY:'auto'}}>
          {clientsList.map(c => (
            <div key={c.id} onClick={() => handleSelectClient(c)} style={{padding:'10px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', background:'#f8fafc', marginBottom:'5px'}}>
              <div style={{fontWeight:'bold'}}>{c.nombre} {c.apellido}</div>
            </div>
          ))}
        </div>
        {selectedClient && <div style={{marginTop:'20px', padding:'15px', background:'#eff6ff', borderRadius:'8px', border:'1px solid #bfdbfe'}}>
           <div style={{fontWeight:'bold', color:'#1e3a8a'}}>{selectedClient.nombre} {selectedClient.apellido}</div>
           <button onClick={()=>setSelectedClient(null)} style={{color:'red', border:'none', background:'none', cursor:'pointer', fontSize:'12px', padding:0, marginTop:'5px'}}>Cambiar</button>
        </div>}
      </div>

      {/* DERECHA */}
      <div style={{...cardStyle, opacity: selectedClient ? 1 : 0.5, pointerEvents: selectedClient ? 'all' : 'none'}}>
        <h3 style={{marginTop:0, color:'#0f172a'}}>2. Datos de la Póliza</h3>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          
          {/* --- CAMPO ASEGURADORA NUEVO --- */}
          <div>
            <label style={labelStyle}>Aseguradora</label>
            <select value={policyData.aseguradora} onChange={e => setPolicyData({...policyData, aseguradora:e.target.value})} style={inputStyle}>
              <option>Banorte</option>
              <option>Atlas</option>
              <option>Qualitas</option>
              <option>Inbursa</option>
              <option>General de Seguros</option>
              <option>Latino</option>
              <option>El Aguila</option>
              <option>Axxa</option>
            </select>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
            <div><label style={labelStyle}>No. Póliza</label><input type="text" required value={policyData.numero_poliza} onChange={e => setPolicyData({...policyData, numero_poliza:e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>No. Recibo</label><input type="text" required value={policyData.numero_recibo} onChange={e => setPolicyData({...policyData, numero_recibo:e.target.value})} style={inputStyle} /></div>
          </div>

          <div>
             <label style={labelStyle}>Forma de Pago</label>
             <select value={policyData.forma_pago} onChange={e => setPolicyData({...policyData, forma_pago:e.target.value})} style={inputStyle}>
               <option>Mensual</option><option>Semestral</option><option>Anual</option>
             </select>
          </div>

          <div style={{borderTop:'1px solid #f1f5f9', paddingTop:'10px'}}>
            <label style={labelStyle}>Vigencia</label>
            <div style={{display:'flex', gap:'10px'}}>
               <input type="date" required value={policyData.recibo_inicio} onChange={e => setPolicyData({...policyData, recibo_inicio:e.target.value})} style={inputStyle} />
               <input type="date" required value={policyData.recibo_fin} onChange={e => setPolicyData({...policyData, recibo_fin:e.target.value})} style={inputStyle} />
            </div>
          </div>
          
          <div><label style={labelStyle}>Fecha Límite Pago</label><input type="date" required value={policyData.fecha_vencimiento_recibo} onChange={e => setPolicyData({...policyData, fecha_vencimiento_recibo:e.target.value})} style={inputStyle} /></div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', background:'#f8fafc', padding:'15px', borderRadius:'8px'}}>
            <div><label style={labelStyle}>Prima Neta</label><input type="text" required placeholder="$0.00" value={policyData.prima_neta} onChange={e => setPolicyData({...policyData, prima_neta:e.target.value})} onBlur={(e) => handleMoneyBlur(e, 'prima_neta')} onFocus={(e) => handleMoneyFocus(e, 'prima_neta')} style={{...inputStyle, fontWeight:'bold'}} /></div>
            <div><label style={labelStyle}>Prima Total</label><input type="text" required placeholder="$0.00" value={policyData.prima_total} onChange={e => setPolicyData({...policyData, prima_total:e.target.value})} onBlur={(e) => handleMoneyBlur(e, 'prima_total')} onFocus={(e) => handleMoneyFocus(e, 'prima_total')} style={{...inputStyle, fontWeight:'bold'}} /></div>
          </div>

          <button disabled={loading} style={{padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', marginTop:'10px'}}>{loading ? '...' : 'Registrar'}</button>
        </form>
      </div>
    </div>
  )
}