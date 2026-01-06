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

  // Datos para Registro (¡Simplificado! Ya no pedimos adminCode aquí)
  const [regData, setRegData] = useState({ email: '', password: '', nombre: '' })
  const [regLoading, setRegLoading] = useState(false)

  // ESTADO PARA EL CÓDIGO DE ACCESO (El muro de seguridad se mantiene)
  const [accessCode, setAccessCode] = useState('')
  const MASTER_KEY = 'Asesur2026' 

  // --- 1. EFECTO DE PERSISTENCIA BLINDADO ---
  useEffect(() => {
    let mounted = true; 

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error; 

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error de sesión:", error.message);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); 

  // --- LOGOUT ---
  const handleLogout = async () => {
    setLoading(true); 
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
    setAccessCode('');
    setLoading(false);
  }

  // --- VERIFICAR ACCESO (El Muro) ---
  const handleVerifyAccess = (e) => {
    e.preventDefault()
    if (accessCode === MASTER_KEY) {
        setView('register') 
        setAccessCode('')   
    } else {
        alert("⛔ Código incorrecto.")
        setAccessCode('')
    }
  }

  // --- REGISTRO (Simplificado) ---
  const handleRegister = async (e) => {
    e.preventDefault(); 
    setRegLoading(true);
    
    // ⚠️ IMPORTANTE: Aquí enviamos 'Empleado/a' para cumplir con tu base de datos
    // Si tuvieras que crear un Admin, lo harías manualmente desde la base de datos de Supabase
    const rol = 'Empleado/a';
    
    try { 
      await authService.register(regData.email, regData.password, regData.nombre, rol); 
      alert("✅ Cuenta creada. Inicia sesión."); 
      setView('login'); 
      // Limpiamos el formulario
      setRegData({ email: '', password: '', nombre: '' });
    } catch (error) { 
      alert(error.message); 
    }
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
            CONECTANDO CON ASESUR...
         </div>
      </div>
    )
  }

  // 2. SI HAY USUARIO -> DASHBOARD
  if (user) return <Dashboard user={user} onLogout={handleLogout} />

  // 3. VISTA DE VERIFICACIÓN
  if (view === 'verify_access') {
      return (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#003786'}}>
          <div style={{width:'100%', maxWidth:'350px', padding:'2rem', background:'white', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.2)'}}>
             <div style={{fontSize:'40px', marginBottom:'10px'}}>🔒</div>
             <h2 style={{color:'#0f172a', marginBottom:'10px'}}>Acceso Restringido</h2>
             <p style={{color:'#64748b', fontSize:'14px', marginBottom:'20px'}}>
                Ingresa el código maestro para crear cuentas.
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

  // 4. VISTA DE REGISTRO (¡Ahora mucho más limpia!)
  if (view === 'register') {
    return (
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#003786'}}>
        <div style={{width:'100%', maxWidth:'400px', padding:'2rem', background:'white', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
            <h1>Crear Cuenta</h1>
            <div style={{background:'#dcfce7', color:'#166534', padding:'5px', borderRadius:'4px', fontSize:'12px', marginBottom:'15px'}}>
                ✅ Nuevo Empleado
            </div>
            
            <form onSubmit={handleRegister} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input 
                  placeholder="Nombre Completo" 
                  value={regData.nombre} 
                  onChange={e=>setRegData({...regData, nombre:e.target.value})} 
                  style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} 
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={regData.email} 
                  onChange={e=>setRegData({...regData, email:e.target.value})} 
                  style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} 
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={regData.password} 
                  onChange={e=>setRegData({...regData, password:e.target.value})} 
                  style={{padding:'12px', borderRadius:'6px', border:'1px solid #ccc'}} 
                  required
                />
                
                {/* AQUÍ ELIMINAMOS EL CHECKBOX Y EL INPUT DE ADMIN CODE.
                   Ahora es un formulario limpio y directo.
                */}

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
          onClick={() => setView('verify_access')} 
          style={{padding:'10px 20px', background:'white', color:'#0f172a', border:'1px solid #e2e8f0', borderRadius:'30px', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}
        >
          ¿Crear nueva cuenta? Acceso Admin →
        </button>
      </div>
    </div>
  )
}

export default App