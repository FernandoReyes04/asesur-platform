import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ProfileModal({ user, isOpen, onClose, onUpdate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && user) {
      getProfile()
    }
  }, [isOpen, user])

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('nombre, email, avatar_url')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setName(data.nombre || '')
        setEmail(data.email || user.email) // Usa el de auth si no hay en profile
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('Error cargando perfil:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}` // Nombre único
      const filePath = `${fileName}`

      // 1. Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL Pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      setAvatarUrl(publicUrl) // Vista previa inmediata

    } catch (error) {
      alert('Error subiendo imagen: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const updates = {
        id: user.id,
        nombre: name,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) throw error
      
      // Notificar al padre que se actualizó el nombre/foto
      onUpdate({ nombre: name, avatar_url: avatarUrl })
      alert('✅ Perfil actualizado correctamente')
      onClose()

    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      
      <div 
        style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()} 
      >
        <button onClick={onClose} style={{position:'absolute', top:'15px', right:'15px', border:'none', background:'transparent', fontSize:'20px', cursor:'pointer', color:'#64748b'}}>✕</button>

        <h2 style={{marginTop:0, textAlign:'center', color:'#0f172a'}}>Editar Perfil</h2>

        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px', marginBottom:'20px'}}>
            
            {/* AVATAR CIRCULAR */}
            <div style={{position:'relative'}}>
                <div style={{
                    width:'100px', height:'100px', borderRadius:'50%', 
                    overflow:'hidden', border:'4px solid #f1f5f9',
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '40px'
                }}>
                    {!avatarUrl && '👤'}
                </div>
                <label htmlFor="avatar-upload" style={{
                    position:'absolute', bottom:0, right:0, 
                    background:'#3b82f6', color:'white', 
                    width:'30px', height:'30px', borderRadius:'50%', 
                    display:'flex', alignItems:'center', justifyContent:'center', 
                    cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    📷
                </label>
                <input 
                    type="file" 
                    id="avatar-upload" 
                    accept="image/*" 
                    onChange={uploadAvatar} 
                    style={{display:'none'}} 
                    disabled={uploading}
                />
            </div>
            {uploading && <span style={{fontSize:'12px', color:'#3b82f6'}}>Subiendo foto...</span>}

            <div style={{width:'100%'}}>
                <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', display:'block', marginBottom:'5px'}}>Nombre Completo</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'14px', boxSizing:'border-box'}}
                />
            </div>

            <div style={{width:'100%'}}>
                <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', display:'block', marginBottom:'5px'}}>Correo Electrónico (Solo lectura)</label>
                <input 
                    type="text" 
                    value={email} 
                    disabled
                    style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#94a3b8', fontSize:'14px', boxSizing:'border-box'}}
                />
            </div>
        </div>

        <button 
            onClick={handleSave} 
            disabled={loading || uploading}
            style={{
                width:'100%', padding:'12px', background:'#0f172a', color:'white', 
                border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer',
                opacity: (loading || uploading) ? 0.7 : 1
            }}
        >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>

      </div>
    </div>
  )
}