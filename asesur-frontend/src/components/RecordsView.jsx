import { useState, useEffect } from 'react'

export default function RecordsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  
  // ESTADOS DEL MODAL
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  // Carga inicial
  useEffect(() => { handleSearch('') }, [])

  const handleSearch = async (term) => {
    setSearchTerm(term)
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3000/api/registros/search?q=${term}`)
      const data = await response.json()
      setResults(data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  // Abrir Modal y preparar datos
  const openModal = (poliza, cliente) => {
    setSelectedRecord({ poliza, cliente })
    setIsEditing(false) 
    setEditFormData(poliza) // Pre-cargamos datos por si decide editar
  }

  // Guardar Cambios (PUT)
  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/polizas/${selectedRecord.poliza.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) throw new Error("Error al actualizar")
      alert("✅ Póliza actualizada correctamente")
      
      // Actualizamos la vista local
      setSelectedRecord({ ...selectedRecord, poliza: editFormData })
      setIsEditing(false)
      handleSearch(searchTerm) // Refrescamos la lista de fondo

    } catch (error) { alert(error.message) }
  }

  // HELPERS
  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  
  const formatDate = (dateString) => {
    if(!dateString) return '---'
    const date = new Date(dateString)
    // Ajuste de zona horaria simple para visualización correcta
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const inputEditStyle = { width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#eff6ff', fontSize:'13px' }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* BARRA DE BÚSQUEDA */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, color: '#0f172a' }}>📂 Consulta de Registros</h2>
        <input type="text" placeholder="🔎 Buscar por Nombre, Apellido o Número de Póliza..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }} />
      </div>

      {/* RESULTADOS (LISTA) */}
      {loading ? <p>Cargando...</p> : results.length === 0 ? <p style={{textAlign:'center', color:'#64748b'}}>Sin resultados.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {results.map(cliente => (
            <div key={cliente.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h3 style={{ margin: 0, color: '#334155' }}>{cliente.nombre} {cliente.apellido}</h3><span style={{ fontSize: '12px', color: '#64748b' }}>RFC: {cliente.rfc || 'N/A'}</span></div>
                <span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{cliente.polizas.length} Póliza(s)</span>
              </div>
              <div style={{ padding: '20px' }}>
                {cliente.polizas.length === 0 ? <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Sin pólizas.</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                        <th style={{ padding: '8px' }}>Póliza</th><th style={{ padding: '8px' }}>Vigencia</th><th style={{ padding: '8px' }}>Total</th><th style={{ padding: '8px' }}>Estado</th><th style={{ padding: '8px', textAlign:'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cliente.polizas.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.numero_poliza}</td>
                          <td style={{ padding: '10px' }}>{p.recibo_inicio} al {p.recibo_fin}</td>
                          <td style={{ padding: '10px' }}>{money(p.prima_total)}</td>
                          <td style={{ padding: '10px' }}><span style={{ color: p.estado === 'activa' ? '#166534' : '#991b1b', background: p.estado === 'activa' ? '#dcfce7' : '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase' }}>{p.estado}</span></td>
                          <td style={{ padding: '10px', textAlign:'right' }}><button onClick={() => openModal(p, cliente)} style={{ border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}>👁️ Ver</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL DE DETALLE ================= */}
      {selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setSelectedRecord(null)}>
          <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '850px', borderRadius: '16px', padding: '30px', position: 'relative', boxShadow: '0 20px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setSelectedRecord(null)} style={{position:'absolute', top:'20px', right:'20px', border:'none', background:'transparent', fontSize:'24px', cursor:'pointer', color:'#64748b'}}>✕</button>

            {/* ENCABEZADO MODAL */}
            <div style={{borderBottom:'1px solid #e2e8f0', paddingBottom:'15px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'end'}}>
               <div>
                  <h2 style={{margin:0, color:'#0f172a'}}>📄 Póliza <span style={{color:'#3b82f6'}}>#{selectedRecord.poliza.numero_poliza}</span></h2>
                  <p style={{margin:'5px 0 0 0', fontSize:'13px', color:'#64748b'}}>Detalle del registro seleccionado</p>
               </div>
               
               {/* BOTÓNES DE ACCIÓN */}
               {!isEditing ? (
                 <button onClick={() => setIsEditing(true)} style={{padding:'8px 15px', background:'#f59e0b', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                   ✏️ Editar Datos
                 </button>
               ) : (
                 <div style={{display:'flex', gap:'10px'}}>
                   <button onClick={() => setIsEditing(false)} style={{padding:'8px 15px', background:'#e2e8f0', color:'#475569', border:'none', borderRadius:'6px', cursor:'pointer'}}>Cancelar</button>
                   <button onClick={handleSaveChanges} style={{padding:'8px 15px', background:'#166534', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>💾 Guardar Cambios</button>
                 </div>
               )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              
              {/* IZQUIERDA: CLIENTE (DATOS COMPLETOS) */}
              <div>
                <h4 style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '5px' }}>Información del Asegurado</h4>
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{fontSize:'11px', color:'#94a3b8'}}>Nombre Completo</span>
                    <strong style={{display:'block', fontSize:'16px', color:'#1e293b'}}>{selectedRecord.cliente.nombre} {selectedRecord.cliente.apellido}</strong>
                  </div>
                  <div>
                    <span style={{fontSize:'11px', color:'#94a3b8'}}>RFC / Tipo Persona</span>
                    <div style={{color:'#334155'}}>
                      {selectedRecord.cliente.rfc || 'No registrado'} <span style={{fontSize:'11px', color:'#64748b'}}>({selectedRecord.cliente.tipo_persona})</span>
                    </div>
                  </div>
                  <div>
                    <span style={{fontSize:'11px', color:'#94a3b8'}}>Dirección</span>
                    <div style={{color:'#334155'}}>
                      {selectedRecord.cliente.direccion}, {selectedRecord.cliente.colonia}<br/>
                      {selectedRecord.cliente.municipio}, {selectedRecord.cliente.estado_direccion}
                    </div>
                  </div>
                  <div>
                    <span style={{fontSize:'11px', color:'#94a3b8'}}>Fecha Nacimiento</span>
                    <div style={{color:'#334155'}}>{formatDate(selectedRecord.cliente.fecha_nacimiento)}</div>
                  </div>
                </div>
              </div>

              {/* DERECHA: PÓLIZA (EDITABLE) */}
              <div>
                <h4 style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '5px' }}>
                    {isEditing ? '✏️ Editando Detalles de Póliza' : 'Detalles de la Póliza'}
                </h4>
                
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* --- ASEGURADORA (NUEVO) --- */}
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#e0f2fe', padding:'10px', borderRadius:'6px', border:'1px solid #bae6fd'}}>
                    <span style={{fontSize:'13px', color:'#0369a1', fontWeight:'bold'}}>Aseguradora:</span>
                    {isEditing ? (
                        <select 
                           value={editFormData.aseguradora || 'Banorte'} 
                           onChange={e=>setEditFormData({...editFormData, aseguradora:e.target.value})} 
                           style={inputEditStyle}
                        >
                            <option>Banorte</option>
                            <option>Atlas</option>
                            <option>Qualitas</option>
                            <option>Inbursa</option>
                            <option>General de Seguros</option>
                            <option>Latino</option>
                            <option>El Aguila</option>
                            <option>Axxa</option>
                        </select>
                    ) : (
                        <span style={{fontWeight:'bold', color:'#0284c7', fontSize:'16px'}}>
                           {selectedRecord.poliza.aseguradora || '---'}
                        </span>
                    )}
                  </div>

                  {/* ESTADO */}
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', padding:'8px', borderRadius:'6px'}}>
                    <span style={{fontSize:'13px', color:'#64748b'}}>Estado:</span>
                    {isEditing ? (
                        <select value={editFormData.estado} onChange={e=>setEditFormData({...editFormData, estado:e.target.value})} style={inputEditStyle}>
                            <option value="activa">ACTIVA</option>
                            <option value="cancelada">CANCELADA</option>
                            <option value="vencida">VENCIDA</option>
                        </select>
                    ) : (
                        <span style={{fontWeight:'bold', color: selectedRecord.poliza.estado === 'activa' ? '#166534' : 'red', textTransform:'uppercase'}}>{selectedRecord.poliza.estado}</span>
                    )}
                  </div>

                  {/* RECIBO Y PAGO */}
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                     <div>
                       <span style={{display:'block', fontSize:'11px', color:'#94a3b8'}}>No. Recibo</span>
                       {isEditing ? <input type="text" value={editFormData.numero_recibo} onChange={e=>setEditFormData({...editFormData, numero_recibo:e.target.value})} style={inputEditStyle} /> : <div style={{fontWeight:'500'}}>{selectedRecord.poliza.numero_recibo}</div>}
                     </div>
                     <div>
                       <span style={{display:'block', fontSize:'11px', color:'#94a3b8'}}>Forma Pago</span>
                       {isEditing ? (
                           <select value={editFormData.forma_pago} onChange={e=>setEditFormData({...editFormData, forma_pago:e.target.value})} style={inputEditStyle}>
                               <option>Mensual</option><option>Semestral</option><option>Anual</option>
                           </select>
                       ) : <div style={{fontWeight:'500'}}>{selectedRecord.poliza.forma_pago}</div>}
                     </div>
                  </div>

                  {/* VIGENCIA */}
                  <div>
                     <span style={{display:'block', fontSize:'11px', color:'#94a3b8'}}>Periodo de Vigencia</span>
                     {isEditing ? (
                         <div style={{display:'flex', gap:'5px'}}>
                             <input type="date" value={editFormData.recibo_inicio} onChange={e=>setEditFormData({...editFormData, recibo_inicio:e.target.value})} style={inputEditStyle} />
                             <input type="date" value={editFormData.recibo_fin} onChange={e=>setEditFormData({...editFormData, recibo_fin:e.target.value})} style={inputEditStyle} />
                         </div>
                     ) : (
                         <div style={{color:'#334155'}}>Del <b>{selectedRecord.poliza.recibo_inicio}</b> al <b>{selectedRecord.poliza.recibo_fin}</b></div>
                     )}
                  </div>

                  {/* FECHA VENCIMIENTO */}
                  <div>
                     <span style={{display:'block', fontSize:'11px', color:'#94a3b8'}}>Vencimiento de Pago</span>
                     {isEditing ? (
                         <input type="date" value={editFormData.fecha_vencimiento_recibo} onChange={e=>setEditFormData({...editFormData, fecha_vencimiento_recibo:e.target.value})} style={inputEditStyle} />
                     ) : (
                         <div style={{color:'#b91c1c', fontWeight:'bold'}}>{formatDate(selectedRecord.poliza.fecha_vencimiento_recibo)}</div>
                     )}
                  </div>
                  
                  {/* MONTOS */}
                  <div style={{background: isEditing ? '#fff7ed' : '#eff6ff', border: isEditing ? '1px solid #fdba74' : 'none', padding:'15px', borderRadius:'8px', marginTop:'10px'}}>
                     <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span style={{color:'#475569', fontSize:'13px'}}>Prima Neta:</span>
                        {isEditing ? <input type="number" value={editFormData.prima_neta} onChange={e=>setEditFormData({...editFormData, prima_neta:e.target.value})} style={{...inputEditStyle, width:'100px'}} /> : <span style={{fontWeight:'500'}}>{money(selectedRecord.poliza.prima_neta)}</span>}
                     </div>
                     <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #bfdbfe', paddingTop:'5px'}}>
                        <span style={{color:'#1e40af', fontWeight:'bold'}}>Prima Total:</span>
                        {isEditing ? <input type="number" value={editFormData.prima_total} onChange={e=>setEditFormData({...editFormData, prima_total:e.target.value})} style={{...inputEditStyle, width:'100px'}} /> : <span style={{color:'#1e40af', fontWeight:'bold', fontSize:'18px'}}>{money(selectedRecord.poliza.prima_total)}</span>}
                     </div>
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