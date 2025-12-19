import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // ESTADO NUEVO: Controla si estamos viendo el Login o la Recuperación
  const [isRecovering, setIsRecovering] = useState(false)

  // 1. FUNCIÓN DE LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Obtenemos datos extra del usuario (Nombre, Rol) si existen en metadata
      const userData = {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.user_metadata?.nombre || data.user.email.split('@')[0]
      }
      
      onLogin(userData)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. FUNCIÓN DE RECUPERACIÓN (NUEVA)
  const handleRecovery = async (e) => {
    e.preventDefault()
    if (!email) return alert("Por favor escribe tu correo.")
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173', // Redirige aquí al dar clic en el correo
      })
      if (error) throw error
      
      alert('✅ Correo de recuperación enviado. Revisa tu bandeja de entrada (y spam).')
      setIsRecovering(false) // Volvemos al login
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ESTILOS
  const containerStyle = {
    height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white'
  }
  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)', padding: '40px', borderRadius: '16px',
    backdropFilter: 'blur(10px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)'
  }
  const inputStyle = {
    width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px',
    border: 'none', background: 'rgba(255, 255, 255, 0.2)', color: 'white', fontSize: '16px', outline: 'none'
  }
  const btnStyle = {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s'
  }
  const linkStyle = {
    color: '#94a3b8', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer', marginTop: '15px', display: 'inline-block'
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '10px' }}>ASESUR 🛡️</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
          {isRecovering ? 'Recuperar Contraseña' : 'Sistema de Gestión'}
        </p>

        {!isRecovering ? (
          // --- FORMULARIO DE LOGIN ---
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={inputStyle} 
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={inputStyle} 
              required
            />
            
            <button disabled={loading} style={btnStyle}>
              {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>

            <div style={{marginTop:'20px'}}>
               <span onClick={() => setIsRecovering(true)} style={linkStyle}>
                 ¿Olvidaste tu contraseña?
               </span>
            </div>
          </form>
        ) : (
          // --- FORMULARIO DE RECUPERACIÓN ---
          <form onSubmit={handleRecovery}>
            <p style={{fontSize:'13px', color:'#cbd5e1', marginBottom:'20px', textAlign:'left'}}>
              Ingresa tu correo y te enviaremos un enlace mágico para restablecer tu acceso.
            </p>
            <input 
              type="email" 
              placeholder="Correo electrónico asociado" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={inputStyle} 
              required
            />
            
            <button disabled={loading} style={{...btnStyle, background:'#f59e0b', color:'white'}}>
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </button>

            <div style={{marginTop:'20px'}}>
               <span onClick={() => setIsRecovering(false)} style={linkStyle}>
                 ← Volver al Login
               </span>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}