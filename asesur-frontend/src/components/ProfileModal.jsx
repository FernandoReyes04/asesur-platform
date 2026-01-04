import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/ProfileModal.css' // <--- IMPORT CSS

export default function ProfileModal({ user, isOpen, onClose, onUpdate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false) // Changed initial state to false to avoid flicker if closed

  // Load data when opening
  useEffect(() => {
    // Moved getProfile INSIDE useEffect to fix dependency warning
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
          setEmail(data.email || user.email) 
          setAvatarUrl(data.avatar_url)
        }
      } catch (error) {
        console.error('Error loading profile:', error.message)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && user) {
      getProfile()
    }
  }, [isOpen, user]) // Dependencies are correct now

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
      const updates = {
        id: user.id,
        nombre: name,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) throw error
      
      onUpdate({ nombre: name, avatar_url: avatarUrl })
      alert('✅ Profile updated successfully')
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