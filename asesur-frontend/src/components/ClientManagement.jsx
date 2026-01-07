import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/ClientManagement.css' 

export default function ClientManagement({ user }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsList, setClientsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', fecha_nacimiento: '', 
    direccion: '', colonia: '', municipio: '', estado_direccion: '', 
    rfc: '', tipo_persona: 'Física', 
    telefono: '', 
    archivo: null, ine_url_existente: ''
  })

  // 1. CARGA INICIAL
  useEffect(() => { fetchClients(searchTerm) }, [searchTerm])

  // 2. REALTIME
  useEffect(() => {
    const channel = supabase
      .channel('cambios-clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => fetchClients(searchTerm))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [searchTerm])

  const fetchClients = async (term) => {
    try {
      const query = term || 'a'
      const response = await fetch(`https://asesur-platform.onrender.com/api/clientes/search?q=${query}`)
      const data = await response.json()
      setClientsList(data)
    } catch (error) { console.error(error) }
  }

  // --- FUNCIÓN DE LIMPIEZA DE NOMBRES (La clave anti-errores) ---
  const sanitizeFileName = (name) => {
    return name
      .normalize("NFD") // Descompone acentos
      .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Reemplaza espacios y símbolos por guión bajo
      .toLowerCase(); // Todo a minúsculas
  }

  const handleSelectClient = (c) => {
    setSelectedClient(c)
    setFormData({
      nombre: c.nombre, apellido: c.apellido, fecha_nacimiento: c.fecha_nacimiento || '',
      direccion: c.direccion || '', colonia: c.colonia || '', municipio: c.municipio || '', estado_direccion: c.estado_direccion || '',
      rfc: c.rfc || '', tipo_persona: c.tipo_persona || 'Física',
      telefono: c.telefono || '', 
      archivo: null, ine_url_existente: c.ine_url
    })
  }

  const handleReset = () => {
    setSelectedClient(null)
    setFormData({
      nombre: '', apellido: '', fecha_nacimiento: '', 
      direccion: '', colonia: '', municipio: '', estado_direccion: '', 
      rfc: '', tipo_persona: 'Física', telefono: '', 
      archivo: null, ine_url_existente: ''
    })
  }

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.startsWith('52')) val = val.substring(2)
    val = val.substring(0, 10)
    
    let formatted = ''
    if (val.length > 0) formatted = `(+52) ${val.substring(0, 3)}`
    if (val.length >= 4) formatted += `-${val.substring(3, 6)}`
    if (val.length >= 7) formatted += `-${val.substring(6, 10)}`

    setFormData({ ...formData, telefono: formatted })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let publicUrl = formData.ine_url_existente
      
      // LÓGICA DE SUBIDA DE ARCHIVO
      if (formData.archivo) {
        // 1. Limpiamos el nombre usando la función segura
        const cleanName = sanitizeFileName(formData.archivo.name)
        // 2. Creamos nombre único
        const fileName = `${Date.now()}_${cleanName}`
        
        // 3. Subimos a Supabase
        // NOTA: Asegúrate que tu bucket se llame 'documentos_clientes' o 'ines' según lo creaste en Supabase.
        // En tu código anterior usabas 'documentos_clientes', así que lo dejé así.
        const { error: uploadError } = await supabase.storage
            .from('documentos_clientes') 
            .upload(fileName, formData.archivo)
        
        if (uploadError) throw uploadError

        // 4. Obtenemos URL
        const { data: urlData } = supabase.storage
            .from('documentos_clientes')
            .getPublicUrl(fileName)
            
        publicUrl = urlData.publicUrl
      } else {
        if (!selectedClient && !formData.archivo) {
            // Opcional: Si quieres permitir registrar sin INE, borra esta línea
            // throw new Error("⚠️ Sube el INE para registros nuevos.") 
        }
      }

      const payload = { ...formData, ine_url: publicUrl, agente_id: user.id || user.user?.id }
      delete payload.archivo; delete payload.ine_url_existente;

      const url = selectedClient ? `https://asesur-platform.onrender.com/api/clientes/${selectedClient.id}` : 'https://asesur-platform.onrender.com/api/clientes'
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
    } catch (error) { 
        console.error(error)
        alert("Error: " + error.message) 
    } finally { 
        setLoading(false) 
    }
  }

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if(e.type==="dragenter"||e.type==="dragover")setDragActive(true);else if(e.type==="dragleave")setDragActive(false); }
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if(e.dataTransfer.files[0]) setFormData({...formData, archivo:e.dataTransfer.files[0]}); }

  return (
    <div className="client-container">
      
      {/* --- FORMULARIO --- */}
      <div className="client-form-card">
        <div className="form-header">
           <h3 className={`form-title ${selectedClient ? 'title-edit' : 'title-new'}`}>
             {selectedClient ? 'Editar' : 'Nuevo'}
           </h3>
           {selectedClient && <button onClick={handleReset} className="cancel-btn">Cancelar</button>}
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          
          <div className="section-title">1. Datos Personales</div>
          <select 
            className="form-input"
            value={formData.tipo_persona} 
            onChange={e => setFormData({...formData, tipo_persona: e.target.value})}
          >
            <option value="Física">Persona Física</option>
            <option value="Moral">Persona Moral (Empresa)</option>
          </select>
          
          <div className="form-row">
            <input className="form-input" placeholder="Nombre(s)" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            <input className="form-input" placeholder="Apellidos" required value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
          </div>

          <div className="form-row">
             <input className="form-input" type="date" required value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
             <input className="form-input" placeholder="(+52) 999-999-9999" value={formData.telefono} onChange={handlePhoneChange} maxLength={19} />
          </div>

          <input className="form-input form-input-uppercase" placeholder="RFC (Opcional)" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})} />

          <div className="section-title">2. Dirección</div>
          <input className="form-input" placeholder="Calle y Número" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
          <div className="form-row">
            <input className="form-input" placeholder="Colonia" value={formData.colonia} onChange={e => setFormData({...formData, colonia: e.target.value})} />
            <input className="form-input" placeholder="Municipio" value={formData.municipio} onChange={e => setFormData({...formData, municipio: e.target.value})} />
          </div>
          <input className="form-input" placeholder="Estado / Entidad" value={formData.estado_direccion} onChange={e => setFormData({...formData, estado_direccion: e.target.value})} />

          <div className="section-title">3. Documentación</div>
          <div 
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            {/* Aceptamos imágenes y PDF */}
            <input 
                type="file" 
                accept="image/*, application/pdf" 
                onChange={(e) => e.target.files[0] && setFormData({...formData, archivo: e.target.files[0]})} 
                className="file-input-hidden" 
            />
            <div className="upload-icon">📂</div>
            <div className="upload-text">
                {formData.archivo ? formData.archivo.name : (selectedClient ? 'Arrastra para cambiar INE' : 'Sube INE o PDF aquí')}
            </div>
          </div>

          <button disabled={loading} className={`submit-btn ${selectedClient ? 'btn-update' : 'btn-create'}`}>
            {loading ? '...' : (selectedClient ? 'Actualizar' : 'Registrar')}
          </button>
        </form>
      </div>

      {/* --- TABLA --- */}
      <div className="client-list-card">
        <input className="form-input search-input" placeholder="Buscar por nombre, apellido o RFC..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        
        <table className="client-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>RFC</th>
              <th>Municipio</th>
              <th style={{textAlign:'right'}}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientsList.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="client-name">{c.nombre} {c.apellido}</div>
                  <div className="client-type">{c.tipo_persona}</div>
                  {c.telefono && <div className="client-phone">{c.telefono}</div>}
                </td>
                <td className="client-rfc">{c.rfc || '---'}</td>
                <td>{c.municipio || '---'}</td>
                <td style={{textAlign:'right'}}>
                  <button onClick={() => handleSelectClient(c)} className="edit-btn">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}