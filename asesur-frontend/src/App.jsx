import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { authService } from './services/authService'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import GridSpinner from './components/GridSpinner' 

import './index.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) 
  
  // VISTAS: 'login', 'verify_access', 'register'
  const [view, setView] = useState('login') 

  // Datos para Registro
  const [regData, setRegData] = useState({ email: '', password: '', nombre: '', adminCode: '', wantsAdmin: false })
  const [regLoading, setRegLoading] = useState(false)

  // --- NUEVO: ESTADO PARA EL CÓDIGO DE ACCESO ---
  const [accessCode, setAccessCode] = useState('')
  const MASTER_KEY = 'Asesur2026' // <--- 🔐 CAMBIA ESTO POR TU CONTRASEÑA MAESTRA

  // --- 1. EFECTO DE PERSISTENCIA ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

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
    setAccessCode('') // Limpiamos el código al salir
  }

  // --- NUEVO: VERIFICAR ACCESO ---
  const handleVerifyAccess = (e) => {
    e.preventDefault()
    if (accessCode === MASTER_KEY) {
        setView('register') // ✅ Código correcto: Pasamos al registro
        setAccessCode('')   // Limpiamos el campo por seguridad
    } else {
        alert("⛔ Código incorrecto. No tienes permiso para crear cuentas.")
        setAccessCode('')
    }
  }

  // --- REGISTRO ---
  const handleRegister = async (e) => {
    e.preventDefault(); setRegLoading(true);
    // Nota: Como ya pasaron el filtro maestro, aquí definimos si quieren ser admin o empleado
    let rol = regData.wantsAdmin && regData.adminCode === MASTER_KEY ? 'admin' : 'empleado';
    
    try { 
      await authService.register(regData.email, regData.password, regData.nombre, rol); 
      alert("✅ Cuenta creada. Por favor inicia sesión."); 
      setView('login'); 
    } catch (error) { alert(error.message); }
    setRegLoading(false);
  }

  // --- PANTALLA DE CARGA ---
  if (loading) {
    return (
      <div style={{
          height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', 
          background:'#456daaff', flexDirection:'column', gap: '20px'
      }}>
         <GridSpinner /> 
         <div style={{color:'#ffffff', fontWeight: 'bold', fontFamily: 'sans-serif', letterSpacing: '1px'}}>
            CARGANDO ASESUR...
         </div>
      </div>
    )
  }

  // 2. SI HAY USUARIO -> DASHBOARD
  if (user) return <Dashboard user={user} onLogout={handleLogout} />

  // --- NUEVO: 3. VISTA DE VERIFICACIÓN (El Muro) ---
  if (view === 'verify_access') {
      return (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#003786'}}>
          <div style={{width:'100%', maxWidth:'350px', padding:'2rem', background:'white', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.2)'}}>
             <div style={{fontSize:'40px', marginBottom:'10px'}}>🔒</div>
             <h2 style={{color:'#0f172a', marginBottom:'10px'}}>Acceso Restringido</h2>
             <p style={{color:'#64748b', fontSize:'14px', marginBottom:'20px'}}>
                La creación de cuentas es exclusiva para administradores. Ingresa el código maestro.
             </p>
             
             <form onSubmit={handleVerifyAccess}>
                <input 
                    type="password" 
                    placeholder="Código Maestro" 
                    value={accessCode} 
                    onChange={e => setAccessCode(e.target.value)} 
                    style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc', width:'100%', boxSizing:'border-box', textAlign:'center', fontSize:'18px', letterSpacing:'2px'}} 
                    autoFocus
                />
                <button type="submit" style={{width:'100%', padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', marginTop:'15px'}}>
                  Verificar Acceso
                </button>
             </form>

             <p onClick={() => setView('login')} style={{cursor:'pointer', color:'#166be5', marginTop:'20px', fontWeight:'bold', fontSize:'14px'}}>
               ← Cancelar
             </p>
          </div>
        </div>
      )
  }

  // 4. VISTA DE REGISTRO (Solo se llega aquí si pasaron el Muro)
  if (view === 'register') {
    return (
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#003786'}}>
        <div style={{width:'100%', maxWidth:'400px', padding:'2rem', background:'white', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
            <h1>Crear Cuenta</h1>
            <div style={{background:'#dcfce7', color:'#166534', padding:'5px', borderRadius:'4px', fontSize:'12px', marginBottom:'15px'}}>
                ✅ Acceso Autorizado
            </div>
            
            <form onSubmit={handleRegister} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input placeholder="Nombre Completo" value={regData.nombre} onChange={e=>setRegData({...regData, nombre:e.target.value})} style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} required/>
                <input type="email" placeholder="Email" value={regData.email} onChange={e=>setRegData({...regData, email:e.target.value})} style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} required/>
                <input type="password" placeholder="Password" value={regData.password} onChange={e=>setRegData({...regData, password:e.target.value})} style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} required/>
                
                {/* Opcional: Aún puedes preguntar si esta cuenta será Admin o Empleado */}
                <div style={{textAlign:'left', fontSize:'14px', background:'#f8fafc', padding:'10px', borderRadius:'6px'}}>
                  <label style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                    <input type="checkbox" checked={regData.wantsAdmin} onChange={e=>setRegData({...regData, wantsAdmin:e.target.checked})}/> 
                    ¿Dar permisos de Administrador?
                  </label>
                  {/* Reutilizamos el mismo código maestro para confirmar el rol de admin */}
                  {regData.wantsAdmin && (
                    <div style={{fontSize:'11px', color:'#64748b', marginTop:'5px', marginLeft:'20px'}}>
                        Se usará el código maestro para confirmar.
                        <input 
                            placeholder="Confirmar Código Maestro" 
                            value={regData.adminCode} 
                            onChange={e=>setRegData({...regData, adminCode:e.target.value})} 
                            style={{marginTop:'5px', width:'100%', padding:'5px', boxSizing:'border-box'}}
                        />
                    </div>
                  )}
                </div>

                <button disabled={regLoading} style={{padding:'12px', background:'#003786', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', marginTop:'10px'}}>
                  {regLoading ? 'Creando...' : 'Registrarse'}
                </button>
            </form>
            <p onClick={() => setView('login')} style={{cursor:'pointer', color:'#166be5', marginTop:'15px', fontWeight:'bold'}}>← Volver al Login</p>
        </div>
      </div>
    )
  }

  // 5. VISTA DE LOGIN (Por defecto)
  return (
    <div>
      <Login onLogin={() => {}} />
      
      <div style={{position:'fixed', bottom:'20px', right:'20px', zIndex:1000}}>
        <button 
          onClick={() => setView('verify_access')} // <--- AHORA MANDA A VERIFICACIÓN PRIMERO
          style={{padding:'10px 20px', background:'white', color:'#0f172a', border:'1px solid #e2e8f0', borderRadius:'30px', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}
        >
          ¿Crear nueva cuenta? Acceso Admin →
        </button>
      </div>
    </div>
  )
}

export default App