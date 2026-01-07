import { useState, useEffect } from 'react'
import '../styles/RecordsView.css'

export default function RecordsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedClientId, setExpandedClientId] = useState(null)

  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  useEffect(() => { handleSearch('') }, [])

  const handleSearch = async (term) => {
    setSearchTerm(term)
    setLoading(true)
    try {
      const response = await fetch(`https://asesur-platform.onrender.com/api/registros/search?q=${term}`)
      const data = await response.json()
      setResults(data)
      setExpandedClientId(null) 
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const toggleExpand = (clientId) => {
      setExpandedClientId(expandedClientId === clientId ? null : clientId)
  }

  // --- NUEVA FUNCIÓN: ELIMINAR PÓLIZA ---
  const handleDeletePolicy = async (policyId) => {
    // 1. Preguntamos confirmación para evitar accidentes
    const confirmDelete = window.confirm(
        "⚠️ ¿Estás seguro de que quieres ELIMINAR esta póliza?\n\nEsta acción la borrará permanentemente de la base de datos y NO se puede deshacer."
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      // 2. Enviamos la orden de borrado al backend
      const response = await fetch(`https://asesur-platform.onrender.com/api/polizas/${policyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("No se pudo eliminar la póliza. Intenta de nuevo.");

      alert("🗑️ Póliza eliminada correctamente.");
      
      // 3. Refrescamos la lista para que desaparezca visualmente
      handleSearch(searchTerm);

    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const openModal = (poliza, cliente) => {
    setSelectedRecord({ poliza, cliente })
    setIsEditing(false) 
    setEditFormData(poliza) 
  }

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`https://asesur-platform.onrender.com/api/polizas/${selectedRecord.poliza.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) throw new Error("Error al actualizar")
      alert("✅ Póliza actualizada correctamente")
      
      setSelectedRecord({ ...selectedRecord, poliza: editFormData })
      setIsEditing(false)
      handleSearch(searchTerm) 

    } catch (error) { alert(error.message) }
  }

  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  
  const formatDate = (dateString) => {
    if(!dateString) return '---'
    const date = new Date(dateString)
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getStatusStyle = (estado) => {
    switch (estado) {
        case 'pagado': return { bg: '#dcfce7', text: '#166534' } 
        case 'vencido': return { bg: '#fee2e2', text: '#991b1b' } 
        case 'cancelada': return { bg: '#f3f4f6', text: '#6b7280' } 
        default: return { bg: '#fef9c3', text: '#854d0e' } 
    }
  }

  return (
    <div className="records-container">
      
      {/* BARRA DE BÚSQUEDA */}
      <div className="search-card">
        <h2 className="search-title">Consulta de Registros</h2>
        <input 
            className="search-input"
            type="text" 
            placeholder="Buscar por Nombre, Apellido o Número de Póliza..." 
            value={searchTerm} 
            onChange={(e) => handleSearch(e.target.value)} 
        />
      </div>

      {/* RESULTADOS (LISTA ACORDEÓN) */}
      {loading ? <p>Cargando...</p> : results.length === 0 ? <p style={{textAlign:'center', color:'#64748b'}}>Sin resultados.</p> : (
        <div className="results-list">
          {results.map(cliente => {
            const isExpanded = expandedClientId === cliente.id
            const hasPolicies = cliente.polizas.length > 0
            
            return (
                <div key={cliente.id} className={`client-card ${isExpanded ? 'expanded' : ''}`}>
                
                {/* CABECERA */}
                <div onClick={() => toggleExpand(cliente.id)} className={`card-header ${isExpanded ? 'expanded' : ''}`}>
                    <div className="header-left">
                        <div className={`avatar-initial ${hasPolicies ? 'avatar-active' : 'avatar-inactive'}`}>
                            {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="client-info">
                            <h3>{cliente.nombre} {cliente.apellido}</h3>
                            <span className="client-rfc">RFC: {cliente.rfc || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="header-right">
                        <span className={`policy-count-badge ${hasPolicies ? 'badge-active' : 'badge-inactive'}`}>
                            {cliente.polizas.length} Póliza(s)
                        </span>
                        <span className={`arrow-icon ${isExpanded ? 'rotated' : ''}`}>▶</span>
                    </div>
                </div>

                {/* CONTENIDO DESPLEGABLE */}
                {isExpanded && (
                    <div className="card-content">
                        <h4 className="content-title">Listado de Pólizas Asociadas</h4>
                        
                        {!hasPolicies ? <p className="empty-policies">Este cliente no tiene pólizas registradas.</p> : (
                            <table className="policies-table">
                            <thead>
                                <tr>
                                    <th>No. Póliza</th>
                                    <th>Aseguradora</th>
                                    <th>Tipo</th> 
                                    <th>Vigencia</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign:'right' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cliente.polizas.map(p => {
                                const statusStyle = getStatusStyle(p.estado)
                                return (
                                    <tr key={p.id}>
                                    <td className="policy-number">{p.numero_poliza}</td>
                                    <td>{p.aseguradora}</td>
                                    <td style={{fontSize:'12px', color:'#64748b'}}>{p.tipo_poliza || '-'}</td>
                                    <td className="date-range">
                                        <div className="date-start">Del: {p.recibo_inicio}</div>
                                        <div className="date-end">Al: {p.recibo_fin}</div>
                                    </td>
                                    <td className="amount">{money(p.prima_total)}</td>
                                    <td>
                                        <span className="status-tag" style={{ color: statusStyle.text, background: statusStyle.bg }}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    <td style={{ textAlign:'right' }}>
                                        {/* CONTENEDOR DE BOTONES (VER + ELIMINAR) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                            <button onClick={(e) => { e.stopPropagation(); openModal(p, cliente); }} className="view-btn">
                                                👁️ Ver Detalle
                                            </button>
                                            
                                            {/* 👇 NUEVO BOTÓN DE ELIMINAR 👇 */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeletePolicy(p.id); }} 
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444', // Rojo
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    padding: '2px'
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                    </tr>
                                )
                                })}
                            </tbody>
                            </table>
                        )}
                    </div>
                )}
                </div>
            )
          })}
        </div>
      )}

      {/* MODAL DETALLE */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedRecord(null)} className="close-modal-btn">✕</button>

            <div className="modal-header">
               <div>
                  <h2 className="modal-title">Póliza <span className="highlight">#{selectedRecord.poliza.numero_poliza}</span></h2>
                  <p className="modal-subtitle">Detalle del registro seleccionado</p>
               </div>
               
               {!isEditing ? (
                 <button onClick={() => setIsEditing(true)} className="action-btn btn-edit">Editar Datos</button>
               ) : (
                 <div style={{display:'flex', gap:'10px'}}>
                   <button onClick={() => setIsEditing(false)} className="action-btn btn-cancel">Cancelar</button>
                   <button onClick={handleSaveChanges} className="action-btn btn-save">Guardar Cambios</button>
                 </div>
               )}
            </div>

            <div className="modal-grid">
              
              {/* IZQUIERDA: CLIENTE */}
              <div>
                <h4 className="section-header">Información del Asegurado</h4>
                <div className="info-group">
                  <div>
                    <span className="info-label">Nombre Completo</span>
                    <strong className="info-value-large">{selectedRecord.cliente.nombre} {selectedRecord.cliente.apellido}</strong>
                  </div>
                  <div>
                    <span className="info-label">Teléfono / WhatsApp</span>
                    <div className="info-value-blue">{selectedRecord.cliente.telefono || 'No registrado'}</div>
                  </div>
                  <div>
                    <span className="info-label">RFC / Tipo Persona</span>
                    <div className="info-value">
                      {selectedRecord.cliente.rfc || 'No registrado'} <span style={{fontSize:'11px', color:'#64748b'}}>({selectedRecord.cliente.tipo_persona})</span>
                    </div>
                  </div>
                  <div>
                    <span className="info-label">Dirección</span>
                    <div className="info-value">
                      {selectedRecord.cliente.direccion}, {selectedRecord.cliente.colonia}<br/>
                      {selectedRecord.cliente.municipio}, {selectedRecord.cliente.estado_direccion}
                    </div>
                  </div>
                  <div>
                    <span className="info-label">Fecha Nacimiento</span>
                    <div className="info-value">{formatDate(selectedRecord.cliente.fecha_nacimiento)}</div>
                  </div>

                  <div>
                    <span className="info-label">Documentación</span>
                    {selectedRecord.cliente.ine_url ? (
                        <a 
                            href={selectedRecord.cliente.ine_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                marginTop: '3px',
                                fontSize: '12px',
                                color: 'white',
                                textDecoration: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#3b82f6',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            Ver INE
                        </a>
                    ) : (
                        <span style={{fontSize:'12px', color:'#94a3b8', fontStyle:'italic'}}>No hay INE adjunta</span>
                    )}
                  </div>

                </div>
              </div>

              {/* DERECHA: PÓLIZA */}
              <div>
                <h4 className="section-header">
                    {isEditing ? 'Editando Detalles de Póliza' : 'Detalles de la Póliza'}
                </h4>
                
                <div className="info-group">
                  
                  {/* FILA 1: Aseguradora y Tipo */}
                  <div className="edit-row">
                    <div style={{flex:1, marginRight:'10px'}}>
                        <span style={{fontSize:'11px', color:'#64748b', display:'block'}}>Aseguradora</span>
                        {isEditing ? (
                            <select value={editFormData.aseguradora || 'Banorte'} onChange={e=>setEditFormData({...editFormData, aseguradora:e.target.value})} className="edit-input">
                                <option>Banorte</option><option>Atlas</option><option>Qualitas</option><option>Inbursa</option><option>General de Seguros</option><option>Latino</option><option>El Aguila</option><option>Axxa</option>
                            </select>
                        ) : (
                            <span style={{fontWeight:'bold', color:'#0284c7', fontSize:'14px'}}>{selectedRecord.poliza.aseguradora || '---'}</span>
                        )}
                    </div>
                    <div style={{flex:1}}>
                        <span style={{fontSize:'11px', color:'#64748b', display:'block'}}>Tipo de Póliza</span>
                        {isEditing ? (
                            <select value={editFormData.tipo_poliza} onChange={e=>setEditFormData({...editFormData, tipo_poliza:e.target.value})} className="edit-input">
                                <option>Seguro de Vida</option><option>Seguro de Auto</option><option>Seguro de Gastos Médicos Mayores</option><option>Seguro de Daños</option><option>Plan Personal de Retiro</option>
                            </select>
                        ) : (
                            <span style={{fontWeight:'bold', color:'#334155', fontSize:'14px'}}>{selectedRecord.poliza.tipo_poliza || '---'}</span>
                        )}
                    </div>
                  </div>

                  {/* FILA 2: Vendedor y Estado */}
                  <div className="status-row" style={{display:'flex', gap:'10px'}}>
                    <div style={{flex:1}}>
                        <span style={{fontSize:'11px', color:'#64748b', display:'block'}}>Vendedor</span>
                        {isEditing ? (
                            <select value={editFormData.vendedor} onChange={e=>setEditFormData({...editFormData, vendedor:e.target.value})} className="edit-input">
                                <option>Oficina</option><option>Shirley</option><option>Yamile</option><option>Gerardo</option><option>Aaron</option><option>Don Luis</option>
                            </select>
                        ) : (
                            <span style={{fontWeight:'bold', color:'#334155', fontSize:'14px'}}>{selectedRecord.poliza.vendedor || 'Oficina'}</span>
                        )}
                    </div>
                    <div style={{flex:1}}>
                        <span style={{fontSize:'11px', color:'#64748b', display:'block'}}>Estado</span>
                        {isEditing ? (
                            <select value={editFormData.estado} onChange={e=>setEditFormData({...editFormData, estado:e.target.value})} className="edit-input">
                                <option value="activa">ACTIVA</option><option value="cancelada">CANCELADA</option><option value="vencida">VENCIDA</option>
                            </select>
                        ) : (
                            <span style={{fontWeight:'bold', color: getStatusStyle(selectedRecord.poliza.estado).text, textTransform:'uppercase'}}>
                                {selectedRecord.poliza.estado}
                            </span>
                        )}
                    </div>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                      <div><span className="info-label" style={{display:'block'}}>No. Recibo</span>{isEditing ? <input type="text" value={editFormData.numero_recibo} onChange={e=>setEditFormData({...editFormData, numero_recibo:e.target.value})} className="edit-input" /> : <div style={{fontWeight:'500'}}>{selectedRecord.poliza.numero_recibo}</div>}</div>
                      <div><span className="info-label" style={{display:'block'}}>Forma Pago</span>{isEditing ? <select value={editFormData.forma_pago} onChange={e=>setEditFormData({...editFormData, forma_pago:e.target.value})} className="edit-input"><option>Mensual</option><option>Semestral</option><option>Anual</option></select> : <div style={{fontWeight:'500'}}>{selectedRecord.poliza.forma_pago}</div>}</div>
                  </div>

                  <div><span className="info-label" style={{display:'block'}}>Vigencia del Recibo</span>{isEditing ? <div style={{display:'flex', gap:'5px'}}><input type="date" value={editFormData.recibo_inicio} onChange={e=>setEditFormData({...editFormData, recibo_inicio:e.target.value})} className="edit-input" /><input type="date" value={editFormData.recibo_fin} onChange={e=>setEditFormData({...editFormData, recibo_fin:e.target.value})} className="edit-input" /></div> : <div style={{color:'#0f172a', fontWeight:'bold'}}>Del {formatDate(selectedRecord.poliza.recibo_inicio)} al {formatDate(selectedRecord.poliza.recibo_fin)}</div>}</div>
                  
                  <div className={`financial-box ${isEditing ? 'editing' : ''}`}>
                      <div className="financial-row"><span style={{color:'#475569', fontSize:'13px'}}>Prima Neta:</span>{isEditing ? <input type="number" value={editFormData.prima_neta} onChange={e=>setEditFormData({...editFormData, prima_neta:e.target.value})} className="edit-input small-money-input" /> : <span style={{fontWeight:'500'}}>{money(selectedRecord.poliza.prima_neta)}</span>}</div>
                      <div className="financial-total"><span className="total-label">Prima Total:</span>{isEditing ? <input type="number" value={editFormData.prima_total} onChange={e=>setEditFormData({...editFormData, prima_total:e.target.value})} className="edit-input small-money-input" /> : <span className="total-value">{money(selectedRecord.poliza.prima_total)}</span>}</div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}