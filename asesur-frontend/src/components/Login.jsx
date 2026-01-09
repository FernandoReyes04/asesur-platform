import { useState } from 'react'
import { supabase } from '../supabaseClient'
import logoLargo from '../icons/LogoLargo.PNG'
import '../styles/Login.css' 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  
  // NUEVO ESTADO PARA VER/OCULTAR CONTRASEÑA
  const [showPassword, setShowPassword] = useState(false)

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
            
            {/* 👇 CONTENEDOR PARA EL INPUT Y EL OJITO 👇 */}
            <div className="password-wrapper">
                <input 
                  className="login-input"
                  type={showPassword ? "text" : "password"} // Aquí está la magia
                  placeholder="Contraseña" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  style={{ paddingRight: '40px' }} // Espacio para que el texto no tape el icono
                />
                
                <button 
  type="button" 
  className="toggle-password-icon"
  onClick={() => setShowPassword(!showPassword)}
>
  {showPassword ? (
    // ESTADO: VISIBLE (Texto) -> Mostramos OJO ABIERTO
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  ) : (
    // ESTADO: OCULTO (Password) -> Mostramos OJO TACHADO
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
  )}
</button>
            </div>
            
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