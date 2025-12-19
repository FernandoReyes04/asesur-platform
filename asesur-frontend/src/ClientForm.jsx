import { useState } from 'react'
import { supabase } from './supabaseClient' // Usamos esto SOLO para subir el archivo (Storage)

export default function ClientForm({ user, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false) // Para efecto visual al arrastrar
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    archivo: null 
  })

  // --- LOGICA DE DRAG & DROP ---
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData({ ...formData, archivo: e.dataTransfer.files[0] })
    }
  }

  const handleChangeFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, archivo: e.target.files[0] })
    }
  }

  // --- LOGICA DE ENVÍO ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.archivo) throw new Error("⚠️ Debes subir el documento INE (PDF o Imagen).")

      // 1. SUBIR ARCHIVO A SUPABASE STORAGE
      // Nombre único: timestamp + nombre_archivo_limpio
      const fileName = `${Date.now()}-${formData.archivo.name.replace(/\s/g, '_')}`
      
      const { error: uploadError } = await supabase.storage
        .from('documentos_clientes') // <--- Asegúrate que este bucket exista en Supabase
        .upload(fileName, formData.archivo)

      if (uploadError) throw uploadError

      // 2. OBTENER URL PÚBLICA
      const { data: urlData } = supabase.storage
        .from('documentos_clientes')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // 3. ENVIAR DATOS A TU BACKEND (NODE.JS)
      const response = await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          fecha_nacimiento: formData.fecha_nacimiento,
          ine_url: publicUrl, // Enviamos el link
          agente_id: user.user?.id || user.id // ID del agente actual
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al registrar")

      alert("✅ Cliente registrado correctamente")
      onSuccess() // Regresa al dashboard

    } catch (error) {
      console.error(error)
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>📝 Registrar Nuevo Cliente</h2>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>Ingresa los datos del asegurado y su identificación.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{display:'flex', flexDirection:'column'}}>
            <label style={labelStyle}>Nombre(s)</label>
            <input type="text" required style={inputStyle} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div style={{display:'flex', flexDirection:'column'}}>
            <label style={labelStyle}>Apellido(s)</label>
            <input type="text" required style={inputStyle} value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column'}}>
           <label style={labelStyle}>Fecha de Nacimiento</label>
           <input type="date" required style={inputStyle} value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
        </div>

        {/* ZONA DE ARRASTRAR (DRAG & DROP) */}
        <div 
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          style={{
            border: dragActive ? '2px solid #3b82f6' : '2px dashed #cbd5e1',
            backgroundColor: dragActive ? '#eff6ff' : '#f8fafc',
            borderRadius: '8px', padding: '30px', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer', position: 'relative'
          }}
        >
          <input type="file" accept="image/*, application/pdf" onChange={handleChangeFile} style={{ position:'absolute', width:'100%', height:'100%', top:0, left:0, opacity:0, cursor:'pointer' }} />
          <div style={{fontSize:'24px', marginBottom:'10px'}}>📂</div>
          {formData.archivo ? (
            <p style={{margin:0, color:'#166534', fontWeight:'bold'}}>✅ Archivo listo: {formData.archivo.name}</p>
          ) : (
            <>
              <p style={{margin:0, color:'#334155', fontWeight:'500'}}>Arrastra su INE aquí o haz clic</p>
              <p style={{margin:0, fontSize:'12px', color:'#94a3b8'}}>Soporta PDF, JPG, PNG</p>
            </>
          )}
        </div>

        <button disabled={loading} style={buttonStyle}>
          {loading ? 'Subiendo y Guardando...' : 'Guardar Cliente'}
        </button>
        <button type="button" onClick={onSuccess} style={{...buttonStyle, background:'transparent', color:'#64748b', border:'1px solid #e2e8f0'}}>
          Cancelar
        </button>
      </form>
    </div>
  )
}

const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }
const labelStyle = { fontSize: '13px', color: '#475569', marginBottom: '5px', fontWeight: '500' }
const buttonStyle = { padding: '12px', borderRadius: '6px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }