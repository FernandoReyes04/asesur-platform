import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient' 
import ClientManagement from './ClientManagement'
import PolicyManagement from './PolicyManagement'
import RecordsView from './RecordsView' 
import MetricsView from './MetricsView'
import NotificationsView from './NotificationsView'
import DashboardHome from './DashboardHome' // <--- IMPORTANTE: El nuevo componente

export default function Dashboard({ user, onLogout }) {
  // Estados de Vista
  const [currentView, setCurrentView] = useState('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // --- OPTIMIZACIÓN DE NOMBRE (CERO DELAY) ---
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem('asesur_user_name') || ''
  })

  // --- RECUPERAR NOMBRE Y GUARDAR EN CACHÉ ---
  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user || !user.id) return

      try {
        const { data } = await supabase
          .from('profiles')
          .select('nombre')
          .eq('id', user.id)
          .single()

        if (data && data.nombre) {
          if (data.nombre !== profileName) {
            setProfileName(data.nombre)
            localStorage.setItem('asesur_user_name', data.nombre)
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfileName()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]) 

  // --- LOGOUT MEJORADO ---
  const handleLogoutClick = () => {
    localStorage.removeItem('asesur_user_name')
    onLogout()
  }

  // --- LÓGICA DE VISUALIZACIÓN ---
  const displayName = profileName || user.user_metadata?.nombre || 'Usuario'

  // Estilos
  const btnStyle = (viewName) => ({
    display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '12px',
    background: currentView === viewName ? '#1e293b' : 'transparent',
    border: 'none', color: currentView === viewName ? '#38bdf8' : '#94a3b8',
    cursor: 'pointer', fontSize: '15px', borderRadius: '6px', marginBottom: '5px'
  })

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#f1f5f9', position: 'relative' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: isSidebarOpen ? '260px' : '80px', background: '#0f172a', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
        <div>
           <h2 onClick={()=>setIsSidebarOpen(!isSidebarOpen)} style={{cursor:'pointer', color:'#38bdf8'}}>ASESUR 🛡️</h2>
           
           <nav style={{marginTop:'30px'}}>
             <button onClick={() => setCurrentView('home')} style={btnStyle('home')}>
               <span>📊</span> {isSidebarOpen && <span>Panel General</span>}
             </button>
             <button onClick={() => setCurrentView('register')} style={btnStyle('register')}>
               <span>👥</span> {isSidebarOpen && <span>Clientes</span>}
             </button>
             <button onClick={() => setCurrentView('polizas')} style={btnStyle('polizas')}>
               <span>📄</span> {isSidebarOpen && <span>Pólizas</span>}
             </button>
             <button onClick={() => setCurrentView('registros')} style={btnStyle('registros')}>
               <span>📂</span> {isSidebarOpen && <span>Registros</span>}
             </button>
             <button onClick={() => setCurrentView('metricas')} style={btnStyle('metricas')}>
               <span>📈</span> {isSidebarOpen && <span>Reportes y Ganancias</span>}
             </button>
             <button onClick={() => setCurrentView('notificaciones')} style={btnStyle('notificaciones')}>
               <span>🔔</span> {isSidebarOpen && <span>Notificaciones</span>}
             </button>
           </nav>
        </div>
        
        <button onClick={handleLogoutClick} style={{background:'#dc2626', color:'white', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer'}}>
          {isSidebarOpen ? 'Cerrar Sesión' : '🚪'}
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        <div style={{ marginBottom: '30px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>
              {currentView === 'home' ? 'Tablero de Control' : 
               currentView === 'register' ? 'Gestión de Clientes' : 
               currentView === 'polizas' ? 'Gestión de Pólizas' : 
               currentView === 'registros' ? 'Consulta de Registros' :
               currentView === 'metricas' ? 'Reportes Financieros' : 'Centro de Notificaciones'}
            </h1>
            <p style={{margin:0, fontSize:'13px', color:'#64748b'}}>Sistema Integral de Gestión Asesur</p>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <span style={{padding:'8px 12px', background:'white', borderRadius:'20px', fontSize:'13px', color:'#334155', border:'1px solid #e2e8f0', fontWeight:'600', minWidth:'100px', textAlign:'center'}}>
              👤 {displayName}
            </span>
          </div>
        </div>

        {/* --- VISTAS --- */}
        {currentView === 'register' ? (
          <ClientManagement user={user} onSuccess={() => setCurrentView('home')} />
        ) : currentView === 'polizas' ? (
          <PolicyManagement />
        ) : currentView === 'registros' ? (
          <RecordsView />
        ) : currentView === 'metricas' ? (
          <MetricsView />
        ) : currentView === 'notificaciones' ? (
          <NotificationsView user={user} />
        ) : (
          // AQUÍ CARGAMOS EL NUEVO PANEL DE WIDGETS
          <DashboardHome />
        )}
      </main>
    </div>
  )
}