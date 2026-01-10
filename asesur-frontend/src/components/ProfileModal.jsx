import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/ProfileModal.css'

export default function ProfileModal({ user, isOpen, onClose, onUpdate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Cargar datos desde user_session en localStorage
  useEffect(() => {
    const loadProfile = () => {
      if (!isOpen || !user) return
      
      setLoading(true)
      try {
        const session = localStorage.getItem('user_session')
        if (session) {
          const userData = JSON.parse(session)
          setName(userData.user?.user_metadata?.nombre || user.nombre || '')
          setEmail(userData.user?.email || user.email || '')
          setAvatarUrl(userData.user?.user_metadata?.avatar_url || null)
        } else {
          setName(user.nombre || '')
          setEmail(user.email || '')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [isOpen, user])

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl) 

    } catch (error) {
      alert('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Actualizar metadatos del usuario en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          nombre: name,
          avatar_url: avatarUrl
        }
      })

      if (error) throw error
      
      // Actualizar localStorage
      const session = localStorage.getItem('user_session')
      if (session) {
        const userData = JSON.parse(session)
        userData.user.user_metadata = {
          ...userData.user.user_metadata,
          nombre: name,
          avatar_url: avatarUrl
        }
        localStorage.setItem('user_session', JSON.stringify(userData))
      }
      
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
    <div className="modal-overlay" onClick={onClose}>
      
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">✕</button>

        <h2 className="modal-title">Edit Profile</h2>

        <div className="form-group">
            
            {/* AVATAR */}
            <div className="avatar-container">
                <div 
                    className="avatar-preview"
                    style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }}
                >
                    {!avatarUrl && '👤'}
                </div>
                <label htmlFor="avatar-upload" className="avatar-upload-label">
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
            {uploading && <span className="uploading-text">Uploading photo...</span>}

            <div className="input-wrapper">
                <label className="input-label">Full Name</label>
                <input 
                    className="modal-input"
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="input-wrapper">
                <label className="input-label">Email (Read-only)</label>
                <input 
                    className="modal-input"
                    type="text" 
                    value={email} 
                    disabled
                />
            </div>
        </div>

        <button 
            onClick={handleSave} 
            disabled={loading || uploading}
            className="save-btn"
        >
            {loading ? 'Saving...' : 'Save Changes'}
        </button>

      </div>
    </div>
  )
}