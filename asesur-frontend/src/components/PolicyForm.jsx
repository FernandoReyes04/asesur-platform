import { useState } from 'react'
import '../styles/PolicyForm.css'

export default function PolicyForm() {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsList, setClientsList] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)

  // URL DE PRODUCCIÓN
  const API_URL = 'https://asesur-platform.onrender.com/api'

  const [policyData, setPolicyData] = useState({
    numero_poliza: '', 
    numero_recibo: '', 
    aseguradora: 'Banorte',
    tipo_poliza: 'Seguro de Vida',
    vendedor: 'Oficina',
    estado: 'pendiente', 
    forma_pago: 'Anual', 
    prima_neta: '', 
    prima_total: '',
    poliza_inicio: '', 
    poliza_fin: '',
    recibo_inicio: '', 
    recibo_fin: ''
  })

  // --- LÓGICA MONEDA ---
  const formatCurrency = (value) => {
    if (!value) return ''
    const number = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    if (isNaN(number)) return ''
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number)
  }
  
  const handleMoneyBlur = (e, field) => { 
      setPolicyData({ ...policyData, [field]: formatCurrency(e.target.value) }) 
  }
  
  const handleMoneyFocus = (e, field) => { 
      const val = e.target.value.replace(/[^0-9.]/g, ''); 
      setPolicyData({ ...policyData, [field]: val }) 
  }

  // --- API ---
  const handleSearch = async (term) => {
    setSearchTerm(term); 
    if (term.length < 3) return
    try { 
        // Usamos la constante API_URL para evitar errores de dedo
        const res = await fetch(`${API_URL}/clientes/search?q=${term}`); 
        const data = await res.json(); 
        setClientsList(data) 
    } catch (e) { console.error(e) }
  }

  const handleSelectClient = (c) => { setSelectedClient(c); setClientsList([]); setSearchTerm('') }

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!selectedClient) return alert("Selecciona cliente")
    
    setLoading(true)
    try {
      // Limpiamos los valores de moneda para enviar solo números
      const cleanPrimaNeta = parseFloat(policyData.prima_neta.toString().replace(/[^0-9.]/g, '')) || 0
      const cleanPrimaTotal = parseFloat(policyData.prima_total.toString().replace(/[^0-9.]/g, '')) || 0
      
      const payload = { 
          ...policyData, 
          // Al ser campos de texto en la BD, pasarán con guiones o barras sin problema
          prima_neta: cleanPrimaNeta, 
          prima_total: cleanPrimaTotal, 
          cliente_id: selectedClient.id 
      }

      console.log("Enviando datos:", payload); 

      const res = await fetch(`${API_URL}/polizas`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      })
      
      // 👇 IMPORTANTE: Leemos la respuesta del servidor antes de lanzar error
      const responseData = await res.json();

      if (!res.ok) {
          // Si falla, mostramos el mensaje exacto que dio la base de datos
          throw new Error(responseData.error || responseData.message || "Error desconocido al registrar")
      }
      
      alert("✅ Póliza registrada correctamente"); 
      
      // Reiniciamos el formulario
      setPolicyData({ 
        numero_poliza:'', numero_recibo:'', aseguradora: 'Banorte', 
        tipo_poliza: 'Seguro de Vida', vendedor: 'Oficina',
        estado: 'pendiente', 
        forma_pago: 'Anual', prima_neta:'', prima_total:'', 
        poliza_inicio:'', poliza_fin:'', recibo_inicio:'', recibo_fin:'' 
      })
      setSelectedClient(null)
      setSearchTerm('')

    } catch (e) { 
        console.error("Error completo:", e);
        alert("❌ Error: " + e.message) 
    } finally { 
        setLoading(false) 
    }
  }

  return (
    <div className="policy-form-container">
        <h2 className="page-title">Registrar Nueva Póliza</h2>
        
        <div className="form-grid">
            
            {/* COLUMNA 1: BUSCADOR */}
            <div className="search-card">
                <h3 className="card-title">1. Cliente</h3>
                <input 
                    className="search-input"
                    type="text" 
                    placeholder=" Buscar cliente..." 
                    value={searchTerm} 
                    onChange={(e) => handleSearch(e.target.value)} 
                />
                <div className="clients-results">
                {clientsList.map(c => (
                    <div key={c.id} onClick={() => handleSelectClient(c)} className="client-item">
                        <div className="client-name">{c.nombre} {c.apellido}</div>
                    </div>
                ))}
                </div>
                {selectedClient && (
                    <div className="selected-client-info">
                        <div className="selected-name"> {selectedClient.nombre} {selectedClient.apellido}</div>
                        <div className="selected-note">Se asignará la póliza a este cliente.</div>
                    </div>
                )}
            </div>

            {/* COLUMNA 2: FORMULARIO */}
            <div className={`details-card ${!selectedClient ? 'disabled' : ''}`}>
                <h3 className="card-title">2. Detalles de Póliza</h3>
                <form onSubmit={handleSubmit} className="policy-form">
                
                {/* FILA 1: Aseguradora y Tipo */}
                <div className="form-row">
                    <div>
                        <label className="input-label">Aseguradora</label>
                        <select className="form-input" value={policyData.aseguradora} onChange={e => setPolicyData({...policyData, aseguradora:e.target.value})}>
                            <option>Banorte</option><option>Atlas</option><option>Qualitas</option><option>Inbursa</option><option>General de Seguros</option><option>Latino</option><option>HDI</option><option>Axa</option><option>Allianz</option><option>Ana Seguros</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Tipo de Póliza</label>
                        <select className="form-input" value={policyData.tipo_poliza} onChange={e => setPolicyData({...policyData, tipo_poliza:e.target.value})}>
                            <option>Seguro de Vida</option>
                            <option>Seguro de Auto</option>
                            <option>Seguro de Gastos Médicos Mayores</option>
                            <option>Seguro de Daños</option>
                            <option>Plan Personal de Retiro</option>
                        </select>
                    </div>
                </div>

                {/* FILA 2: Vendedor y Estado */}
                <div className="form-row">
                    <div>
                        <label className="input-label">Vendedor</label>
                        <select className="form-input" value={policyData.vendedor} onChange={e => setPolicyData({...policyData, vendedor:e.target.value})}>
                            <option>Oficina</option>
                            <option>Shirley</option>
                            <option>Yamile</option>
                            <option>Gerardo</option>
                            <option>Aaron</option>
                            <option>Don Luis</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Estado Inicial</label>
                        <select 
                            className="form-input" 
                            value={policyData.estado} 
                            onChange={e => setPolicyData({...policyData, estado:e.target.value})}
                            style={{fontWeight:'bold', color: policyData.estado === 'pagado' ? '#166534' : '#854d0e'}}
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="pagado">Pagado (Histórico)</option>
                        </select>
                    </div>
                </div>

                {/* FILA 3: Forma Pago y Poliza */}
                <div className="form-row">
                    <div>
                         <label className="input-label">Forma Pago</label>
                        <select className="form-input" value={policyData.forma_pago} onChange={e => setPolicyData({...policyData, forma_pago:e.target.value})}>
                            <option>Mensual</option><option>Bimestral</option><option>Semestral</option><option>Trimestral</option><option>Cuatrimestral</option><option>Anual</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">No. Póliza</label>
                        {/* Acepta texto libre (guiones, letras, números) */}
                        <input 
                            className="form-input" 
                            type="text" 
                            required 
                            placeholder="Ej: I59-1-1-11490"
                            value={policyData.numero_poliza} 
                            onChange={e => setPolicyData({...policyData, numero_poliza:e.target.value})} 
                        />
                    </div>
                </div>

                 {/* FILA 4: Recibo */}
                 <div className="form-row">
                    <div>
                        <label className="input-label">No. Recibo</label>
                        {/* Acepta texto libre (barras, guiones) */}
                        <input 
                            className="form-input" 
                            type="text" 
                            required 
                            placeholder="Ej: 1/4"
                            value={policyData.numero_recibo} 
                            onChange={e => setPolicyData({...policyData, numero_recibo:e.target.value})} 
                        />
                    </div>
                    <div></div>
                </div>

                {/* VIGENCIA PÓLIZA */}
                <div className="date-group policy">
                    <label className="group-label policy">Vigencia General de Póliza</label>
                    <div className="form-row">
                        <div>
                            <label className="mini-label">Inicio</label>
                            <input className="form-input" type="date" required value={policyData.poliza_inicio} onChange={e => setPolicyData({...policyData, poliza_inicio:e.target.value})} />
                        </div>
                        <div>
                            <label className="mini-label">Fin</label>
                            <input className="form-input" type="date" required value={policyData.poliza_fin} onChange={e => setPolicyData({...policyData, poliza_fin:e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* VIGENCIA RECIBO */}
                <div className="date-group receipt">
                    <label className="group-label receipt">Cobertura del Recibo (Pago)</label>
                    <div className="form-row">
                        <div>
                            <label className="mini-label">Desde</label>
                            <input className="form-input" type="date" required value={policyData.recibo_inicio} onChange={e => setPolicyData({...policyData, recibo_inicio:e.target.value})} />
                        </div>
                        <div>
                            <label className="mini-label">Hasta</label>
                            <input className="form-input" type="date" required value={policyData.recibo_fin} onChange={e => setPolicyData({...policyData, recibo_fin:e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div>
                        <label className="input-label">Prima Neta</label>
                        <input className="form-input money-input" type="text" required placeholder="$0.00" value={policyData.prima_neta} onChange={e => setPolicyData({...policyData, prima_neta:e.target.value})} onBlur={(e) => handleMoneyBlur(e, 'prima_neta')} onFocus={(e) => handleMoneyFocus(e, 'prima_neta')} />
                    </div>
                    <div>
                        <label className="input-label">Prima Total</label>
                        <input className="form-input money-input" type="text" required placeholder="$0.00" value={policyData.prima_total} onChange={e => setPolicyData({...policyData, prima_total:e.target.value})} onBlur={(e) => handleMoneyBlur(e, 'prima_total')} onFocus={(e) => handleMoneyFocus(e, 'prima_total')} />
                    </div>
                </div>

                <button disabled={loading} className="save-btn">
                    {loading ? 'Guardando...' : 'Registrar Póliza'}
                </button>
                </form>
            </div>
        </div>
    </div>
  )
}