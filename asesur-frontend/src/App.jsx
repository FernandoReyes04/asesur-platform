import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient' // <--- NUESTRA FUENTE DE VERDAD
import { authService } from './services/authService' // Solo lo usaremos para el registro (backend)
import Dashboard from './components/Dashboard'
import Login from './components/Login'

import './index.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Importante para no mostrar el Login mientras carga
  const [view, setView] = useState('login') // 'login' o 'register'

  // Datos para Registro (Mantenemos tu lógica de formulario)
  const [regData, setRegData] = useState({ email: '', password: '', nombre: '', adminCode: '', wantsAdmin: false })
  const [regLoading, setRegLoading] = useState(false)

  // --- 1. EFECTO DE PERSISTENCIA (LA MAGIA) 🧙‍♂️ ---
  useEffect(() => {
    // A. Verificar sesión actual al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // B. Escuchar cambios (Login, Logout, Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- LOGOUT ---
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setView('login')
  }

  // --- REGISTRO ---
  const handleRegister = async (e) => {
    e.preventDefault(); setRegLoading(true);
    let rol = regData.wantsAdmin && regData.adminCode === 'PROFE123' ? 'admin' : 'empleado';
    try { 
      // Usamos tu authService que conecta con el backend para crear el registro completo
      await authService.register(regData.email, regData.password, regData.nombre, rol); 
      alert("✅ Cuenta creada. Por favor inicia sesión."); 
      setView('login'); 
    } catch (error) { alert(error.message); }
    setRegLoading(false);
  }

  // 1. PANTALLA DE CARGA (Para evitar parpadeos al dar F5)
  if (loading) {
    return (
      <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0f2f5', flexDirection:'column'}}>
         <div style={{fontSize:'40px', marginBottom:'20px'}}>🛡️</div>
         <div style={{color:'#64748b'}}>Cargando sesión...</div>
      </div>
    )
  }

  // 2. SI HAY USUARIO -> DASHBOARD
  if (user) return <Dashboard user={user} onLogout={handleLogout} />

  // 3. VISTA DE REGISTRO
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

                <button disabled={regLoading} style={{padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', marginTop:'10px'}}>
                  {regLoading ? 'Creando...' : 'Registrarse'}
                </button>
            </form>
            <p onClick={() => setView('login')} style={{cursor:'pointer', color:'#2563eb', marginTop:'15px', fontWeight:'bold'}}>← Volver al Login</p>
        </div>
      </div>
    )
  }

  // 4. VISTA DE LOGIN (Por defecto)
  return (
    <div>
      {/* Ya no necesitamos pasar setUser manual, el listener de Supabase detectará el login automáticamente */}
      <Login onLogin={() => {}} />
      
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