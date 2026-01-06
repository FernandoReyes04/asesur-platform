import { useState } from 'react'
import { supabase } from '../supabaseClient'
import logoLargo from '../icons/LogoLargo.png'
import '../styles/Login.css' // <--- IMPORTAMOS EL CSS AQUÍ

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)

  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
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

  // 2. RECUPERACIÓN
  const handleRecovery = async (e) => {
    e.preventDefault()
    if (!email) return alert("Por favor escribe tu correo.")
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, 
      })
      if (error) throw error
      
      alert('✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.')
      setIsRecovering(false)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logoLargo} alt="Grupo Asesur" className="login-logo" />
        <p className="login-subtitle">
          {isRecovering ? 'Recuperar Contraseña' : 'Bienvenido al sistema de gestión'}
        </p>

        {!isRecovering ? (
          <form onSubmit={handleLogin}>
            <input 
              className="login-input"
              type="email" 
              placeholder="Correo electrónico" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            <input 
              className="login-input"
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            
            <button disabled={loading} className="login-btn">
              {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>

            <div className="login-link-container">
               <span onClick={() => setIsRecovering(true)} className="login-link">
                 ¿Olvidaste tu contraseña?
               </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecovery}>
            <p className="recover-text">
              Ingresa tu correo y te enviaremos un enlace mágico para restablecer tu acceso.
            </p>
            <input 
              className="login-input"
              type="email" 
              placeholder="Correo electrónico asociado" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            
            <button disabled={loading} className="login-btn login-btn-recover">
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </button>

            <div className="login-link-container">
               <span onClick={() => setIsRecovering(false)} className="login-link">
                 ← Volver al Login
               </span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}