import { useState } from 'react'
import { authService } from './services/authService'
import Dashboard from './components/Dashboard'
import Login from './components/Login' // <--- Importamos tu nuevo componente

import './index.css'

function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser() || null)
  const [view, setView] = useState('login') // 'login' o 'register'
  const [loading, setLoading] = useState(false)

  // Datos para Registro
  const [regData, setRegData] = useState({ email: '', password: '', nombre: '', adminCode: '', wantsAdmin: false })

  // --- LOGOUT ---
  const handleLogout = () => { authService.logout(); setUser(null); setView('login'); }

  // --- REGISTRO (Lógica se mantiene aquí o podrías moverla a otro componente luego) ---
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    let rol = regData.wantsAdmin && regData.adminCode === 'PROFE123' ? 'admin' : 'empleado';
    try { 
      await authService.register(regData.email, regData.password, regData.nombre, rol); 
      alert("✅ Cuenta creada. Por favor inicia sesión."); 
      setView('login'); 
    } catch (error) { alert(error.message); }
    setLoading(false);
  }

  // 1. SI YA ESTÁ LOGUEADO -> DASHBOARD
  if (user) return <Dashboard user={user} onLogout={handleLogout} />

  // 2. SI QUIERE REGISTRARSE -> FORMULARIO REGISTRO
  if (view === 'register') {
    return (
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f0f2f5'}}>
        <div style={{width:'100%', maxWidth:'400px', padding:'2rem', background:'white', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
            <h1>Crear Cuenta 🚀</h1>
            <form onSubmit={handleRegister} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input placeholder="Nombre Completo" value={regData.nombre} onChange={e=>setRegData({...regData, nombre:e.target.value})} style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} required/>
                <input type="email" placeholder="Email" value={regData.email} onChange={e=>setRegData({...regData, email:e.target.value})} style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} required/>
                <input type="password" placeholder="Password" value={regData.password} onChange={e=>setRegData({...regData, password:e.target.value})} style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} required/>
                
                <div style={{textAlign:'left', fontSize:'14px', background:'#f8fafc', padding:'10px', borderRadius:'6px'}}>
                  <label style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                    <input type="checkbox" checked={regData.wantsAdmin} onChange={e=>setRegData({...regData, wantsAdmin:e.target.checked})}/> 
                    ¿Eres Administrador?
                  </label>
                  {regData.wantsAdmin && <input placeholder="Código secreto" value={regData.adminCode} onChange={e=>setRegData({...regData, adminCode:e.target.value})} style={{marginTop:'5px', width:'100%', padding:'5px', boxSizing:'border-box'}}/>}
                </div>

                <button disabled={loading} style={{padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', marginTop:'10px'}}>
                  {loading ? 'Creando...' : 'Registrarse'}
                </button>
            </form>
            <p onClick={() => setView('login')} style={{cursor:'pointer', color:'#2563eb', marginTop:'15px', fontWeight:'bold'}}>← Volver al Login</p>
        </div>
      </div>
    )
  }

  // 3. SI NO -> LOGIN (Usamos tu componente nuevo)
  return (
    <div>
      {/* Pasamos la función para loguearse */}
      <Login onLogin={(userData) => setUser(userData)} />
      
      {/* Botón flotante para ir a Registro (Ya que Login.jsx ocupa toda la pantalla) */}
      <div style={{position:'fixed', bottom:'20px', right:'20px', zIndex:1000}}>
        <button 
          onClick={() => setView('register')}
          style={{padding:'10px 20px', background:'white', color:'#0f172a', border:'1px solid #e2e8f0', borderRadius:'30px', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}
        >
          ¿No tienes cuenta? Regístrate aquí →
        </button>
      </div>
    </div>
  )
}

export default App