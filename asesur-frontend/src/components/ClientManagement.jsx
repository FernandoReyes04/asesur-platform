import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ClientManagement({ user }) {
  // ESTADOS
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsList, setClientsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // FORMULARIO (Actualizado con teléfono)
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', fecha_nacimiento: '', 
    direccion: '', colonia: '', municipio: '', estado_direccion: '', 
    rfc: '', tipo_persona: 'Física', 
    telefono: '', // <--- 1. NUEVO CAMPO EN ESTADO
    archivo: null, ine_url_existente: ''
  })

  // 1. CARGA INICIAL Y BÚSQUEDA
  useEffect(() => { fetchClients(searchTerm) }, [searchTerm])

  // 2. REALTIME
  useEffect(() => {
    const channel = supabase
      .channel('cambios-clientes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => {
          console.log('🔔 Cambio detectado:', payload)
          fetchClients(searchTerm) 
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [searchTerm])

  // --- LÓGICA DE DATOS ---
  
  const fetchClients = async (term) => {
    try {
      const query = term || 'a'
      const response = await fetch(`http://localhost:3000/api/clientes/search?q=${query}`)
      const data = await response.json()
      setClientsList(data)
    } catch (error) { console.error(error) }
  }

  // 3. SELECCIONAR CLIENTE (Actualizado)
  const handleSelectClient = (c) => {
    setSelectedClient(c)
    setFormData({
      nombre: c.nombre, apellido: c.apellido, fecha_nacimiento: c.fecha_nacimiento || '',
      direccion: c.direccion || '', colonia: c.colonia || '', municipio: c.municipio || '', estado_direccion: c.estado_direccion || '',
      rfc: c.rfc || '', tipo_persona: c.tipo_persona || 'Física',
      telefono: c.telefono || '', // <--- 2. CARGAR TELÉFONO
      archivo: null, ine_url_existente: c.ine_url
    })
  }

  // 4. LIMPIAR (Actualizado)
  const handleReset = () => {
    setSelectedClient(null)
    setFormData({
      nombre: '', apellido: '', fecha_nacimiento: '', 
      direccion: '', colonia: '', municipio: '', estado_direccion: '', 
      rfc: '', tipo_persona: 'Física', 
      telefono: '', // <--- 3. RESETEAR TELÉFONO
      archivo: null, ine_url_existente: ''
    })
  }

  // 5. MÁSCARA DE TELÉFONO (NUEVA FUNCIÓN) 📞
  const handlePhoneChange = (e) => {
    let val = e.target.value
    // a. Solo números
    val = val.replace(/\D/g, '')
    // b. Ignorar prefijo 52 si lo escriben manual
    if (val.startsWith('52')) val = val.substring(2)
    // c. Limitar a 10 dígitos
    val = val.substring(0, 10)
    
    // d. Formatear
    let formatted = ''
    if (val.length > 0) formatted = `(+52) ${val.substring(0, 3)}`
    if (val.length >= 4) formatted += `-${val.substring(3, 6)}`
    if (val.length >= 7) formatted += `-${val.substring(6, 10)}`

    setFormData({ ...formData, telefono: formatted })
  }

  // 6. GUARDAR
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let publicUrl = formData.ine_url_existente
      if (formData.archivo) {
        const fileName = `${Date.now()}-${formData.archivo.name.replace(/\s/g, '_')}`
        const { error: uploadError } = await supabase.storage.from('documentos_clientes').upload(fileName, formData.archivo)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('documentos_clientes').getPublicUrl(fileName)
        publicUrl = urlData.publicUrl
      } else {
        if (!selectedClient && !formData.archivo) throw new Error("⚠️ Sube el INE para registros nuevos.")
      }

      const payload = {
        ...formData,
        ine_url: publicUrl,
        agente_id: user.id || user.user?.id
      }
      delete payload.archivo; delete payload.ine_url_existente;

      const url = selectedClient 
        ? `http://localhost:3000/api/clientes/${selectedClient.id}` 
        : 'http://localhost:3000/api/clientes'
      
      const method = selectedClient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error("Error en la operación")
      alert("✅ Datos guardados correctamente")
      handleReset()
      fetchClients(searchTerm) 
    } catch (error) { alert("Error: " + error.message) } finally { setLoading(false) }
  }

  // UI Helpers
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if(e.type==="dragenter"||e.type==="dragover")setDragActive(true);else if(e.type==="dragleave")setDragActive(false); }
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if(e.dataTransfer.files[0]) setFormData({...formData, archivo:e.dataTransfer.files[0]}); }
  
  // ESTILOS
  const sectionTitle = { fontSize:'11px', fontWeight:'bold', color:'#94a3b8', textTransform:'uppercase', marginTop:'15px', marginBottom:'5px', borderBottom:'1px solid #eee', paddingBottom:'2px' }
  const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', fontSize:'13px' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '30px', alignItems: 'start' }}>
      
      {/* --- FORMULARIO --- */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
           <h3 style={{ margin: 0, color: selectedClient ? '#f59e0b' : '#10b981' }}>{selectedClient ? '✏️ Editar' : '🚀 Nuevo'}</h3>
           {selectedClient && <button onClick={handleReset} style={{fontSize:'11px', padding:'4px'}}>Cancelar</button>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={sectionTitle}>1. Datos Personales</div>
          <select value={formData.tipo_persona} onChange={e => setFormData({...formData, tipo_persona: e.target.value})} style={inputStyle}>
            <option value="Física">Persona Física</option>
            <option value="Moral">Persona Moral (Empresa)</option>
          </select>
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <input placeholder="Nombre(s)" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={inputStyle} />
            <input placeholder="Apellidos" required value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} style={inputStyle} />
          </div>

          {/* AQUÍ AGREGAMOS EL INPUT DE TELÉFONO JUNTO A LA FECHA */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
             <input type="date" required value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} style={inputStyle} />
             <input 
                placeholder="(+52) 999-999-9999" 
                value={formData.telefono} 
                onChange={handlePhoneChange} 
                style={inputStyle} 
                maxLength={19}
             />
          </div>

          <input placeholder="RFC (Opcional)" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})} style={{...inputStyle, textTransform:'uppercase'}} />

          <div style={sectionTitle}>2. Dirección</div>
          <input placeholder="Calle y Número" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} style={inputStyle} />
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <input placeholder="Colonia" value={formData.colonia} onChange={e => setFormData({...formData, colonia: e.target.value})} style={inputStyle} />
            <input placeholder="Municipio" value={formData.municipio} onChange={e => setFormData({...formData, municipio: e.target.value})} style={inputStyle} />
          </div>
          <input placeholder="Estado / Entidad" value={formData.estado_direccion} onChange={e => setFormData({...formData, estado_direccion: e.target.value})} style={inputStyle} />

          <div style={sectionTitle}>3. Documentación</div>
          <div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            style={{ border: dragActive ? '2px solid #3b82f6' : '1px dashed #cbd5e1', background: dragActive ? '#eff6ff' : '#f8fafc', padding: '15px', textAlign: 'center', borderRadius: '6px', cursor:'pointer', position:'relative' }}
          >
            <input type="file" accept="image/*, application/pdf" onChange={(e) => e.target.files[0] && setFormData({...formData, archivo: e.target.files[0]})} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0 }} />
            <div style={{fontSize:'20px'}}>📂</div>
            <div style={{fontSize:'11px', color:'#64748b'}}>{formData.archivo ? formData.archivo.name : (selectedClient ? 'Arrastra para cambiar INE' : 'Sube el INE aquí')}</div>
          </div>

          <button disabled={loading} style={{ padding: '10px', background: selectedClient ? '#f59e0b' : '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor:'pointer', marginTop:'10px' }}>
            {loading ? '...' : (selectedClient ? 'Actualizar' : 'Registrar')}
          </button>
        </form>
      </div>

      {/* --- TABLA --- */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <input type="text" placeholder="🔍 Buscar por nombre, apellido o RFC..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, padding:'12px', marginBottom:'20px', background:'#f8fafc'}} />
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
            <tr>
              <th style={{padding:'10px'}}>Cliente</th>
              <th style={{padding:'10px'}}>RFC</th>
              <th style={{padding:'10px'}}>Municipio</th>
              <th style={{padding:'10px', textAlign:'right'}}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientsList.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{padding:'10px', fontWeight:'500'}}>
                  <div>{c.nombre} {c.apellido}</div>
                  <div style={{fontSize:'10px', color:'#94a3b8'}}>{c.tipo_persona}</div>
                  {/* Mostrar teléfono pequeño en la tabla si existe */}
                  {c.telefono && <div style={{fontSize:'10px', color:'#3b82f6'}}>{c.telefono}</div>}
                </td>
                <td style={{padding:'10px', fontFamily:'monospace'}}>{c.rfc || '---'}</td>
                <td style={{padding:'10px'}}>{c.municipio || '---'}</td>
                <td style={{padding:'10px', textAlign:'right'}}>
                  <button onClick={() => handleSelectClient(c)} style={{border:'1px solid #e2e8f0', background:'white', color:'#2563eb', borderRadius:'4px', cursor:'pointer'}}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}