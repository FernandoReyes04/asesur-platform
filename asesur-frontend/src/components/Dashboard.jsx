import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient' 
import ClientManagement from './ClientManagement'
import PolicyManagement from './PolicyManagement'
import RecordsView from './RecordsView' 
import MetricsView from './MetricsView'
import NotificationsView from './NotificationsView'
import DashboardHome from './DashboardHome'
import ProfileModal from './ProfileModal'

export default function Dashboard({ user, onLogout }) {
  // Estados de Vista
  const [currentView, setCurrentView] = useState('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  // --- NUEVO ESTADO: CONTROL DEL SUBMENÚ ADMINISTRACIÓN ---
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  // Estado para Datos del Perfil
  const [profileData, setProfileData] = useState({
    nombre: localStorage.getItem('asesur_user_name') || 'Usuario',
    avatar_url: null
  })

  // --- CARGAR PERFIL ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !user.id) return
      try {
        const { data } = await supabase
          .from('profiles')
          .select('nombre, avatar_url')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfileData({
             nombre: data.nombre || 'Usuario',
             avatar_url: data.avatar_url
          })
          if (data.nombre) localStorage.setItem('asesur_user_name', data.nombre)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
    fetchProfile()
  }, [user])

  const handleLogoutClick = () => {
    localStorage.removeItem('asesur_user_name')
    onLogout()
  }

  const handleProfileUpdate = (newData) => {
      setProfileData(prev => ({ ...prev, ...newData }))
      if(newData.nombre) localStorage.setItem('asesur_user_name', newData.nombre)
  }

  // --- ESTILOS ---
  const btnStyle = (viewName) => ({
    display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '12px',
    background: currentView === viewName ? '#1e293b' : 'transparent',
    border: 'none', color: currentView === viewName ? '#38bdf8' : '#94a3b8',
    cursor: 'pointer', fontSize: '15px', borderRadius: '6px', marginBottom: '5px',
    textAlign: 'left'
  })

  // Estilo para los botones del submenú (más pequeños y con sangría)
  const subBtnStyle = (viewName) => ({
    ...btnStyle(viewName),
    paddingLeft: '45px', // Sangría
    fontSize: '13px',
    color: currentView === viewName ? '#38bdf8' : '#cbd5e1'
  })

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#f1f5f9', position: 'relative' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: isSidebarOpen ? '260px' : '80px', background: '#0f172a', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s', overflowY: 'auto' }}>
        <div>
           <h2 onClick={()=>setIsSidebarOpen(!isSidebarOpen)} style={{cursor:'pointer', color:'#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden'}}>
             {isSidebarOpen ? 'ASESUR 🛡️' : '🛡️'}
           </h2>
           
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
               <span>📈</span> {isSidebarOpen && <span>Reportes</span>}
             </button>

             {/* --- SECCIÓN DE ADMINISTRACIÓN (DESPLEGABLE) --- */}
             <button 
                onClick={() => {
                    if(!isSidebarOpen) setIsSidebarOpen(true); // Abrir sidebar si está cerrado
                    setShowAdminMenu(!showAdminMenu);
                }} 
                style={{
                    ...btnStyle('admin'), 
                    justifyContent: 'space-between', 
                    background: (currentView === 'recibos' || currentView === 'renovaciones') ? '#1e293b' : 'transparent'
                }}
             >
               <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                   <span>⚙️</span> 
                   {isSidebarOpen && <span>Administración</span>}
               </div>
               {isSidebarOpen && <span style={{fontSize:'10px'}}>{showAdminMenu ? '▼' : '▶'}</span>}
             </button>

             {/* SUBMENÚ (Solo visible si el sidebar y el menú están abiertos) */}
             {isSidebarOpen && showAdminMenu && (
                 <div style={{background: '#0f172a', marginBottom: '5px', borderRadius: '0 0 6px 6px'}}>
                     <button onClick={() => setCurrentView('recibos')} style={subBtnStyle('recibos')}>
                        🧾 Recibos (Cobranza)
                     </button>
                     <button onClick={() => setCurrentView('renovaciones')} style={subBtnStyle('renovaciones')}>
                        🔄 Renovaciones
                     </button>
                 </div>
             )}

           </nav>
        </div>
        
        <button onClick={handleLogoutClick} style={{background:'#dc2626', color:'white', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer', marginTop:'20px'}}>
          {isSidebarOpen ? 'Cerrar Sesión' : '🚪'}
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        <div style={{ marginBottom: '30px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>
              {/* TÍTULOS DINÁMICOS */}
              {currentView === 'home' ? 'Tablero de Control' : 
               currentView === 'register' ? 'Gestión de Clientes' : 
               currentView === 'polizas' ? 'Gestión de Pólizas' : 
               currentView === 'registros' ? 'Consulta de Registros' :
               currentView === 'metricas' ? 'Reportes Financieros' : 
               currentView === 'recibos' ? 'Gestión de Recibos y Cobranza' :
               currentView === 'renovaciones' ? 'Gestión de Renovaciones' : 'Panel'}
            </h1>
            <p style={{margin:0, fontSize:'13px', color:'#64748b'}}>Sistema Integral de Gestión Asesur</p>
          </div>
          
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div 
                onClick={() => setIsProfileOpen(true)}
                style={{
                    padding:'5px 12px 5px 5px', background:'white', borderRadius:'30px', 
                    display:'flex', alignItems:'center', gap:'10px',
                    border:'1px solid #e2e8f0', cursor:'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'transform 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                  width:'32px', height:'32px', borderRadius:'50%', 
                  background: profileData.avatar_url ? `url(${profileData.avatar_url}) center/cover` : '#eff6ff',
                  color:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px'
              }}>
                  {!profileData.avatar_url && '👤'}
              </div>
              <span style={{fontSize:'13px', color:'#334155', fontWeight:'600'}}>
                {profileData.nombre}
              </span>
            </div>
          </div>
        </div>

        {/* --- CONTROLADOR DE VISTAS --- */}
        {currentView === 'register' ? (
            <ClientManagement user={user} onSuccess={() => setCurrentView('home')} />
        ) : currentView === 'polizas' ? (
            <PolicyManagement />
        ) : currentView === 'registros' ? (
            <RecordsView />
        ) : currentView === 'metricas' ? (
            <MetricsView />
        ) : currentView === 'recibos' ? (
            // AQUI USAMOS TU VISTA DE NOTIFICACIONES PARA LOS RECIBOS
            <NotificationsView user={user} />
        ) : currentView === 'renovaciones' ? (
            // VISTA TEMPORAL PARA RENOVACIONES
            <div style={{textAlign:'center', padding:'50px', color:'#64748b', background:'white', borderRadius:'12px'}}>
                <h2>🔄 Módulo de Renovaciones</h2>
                <p>Esta funcionalidad estará disponible próximamente.</p>
            </div>
        ) : (
            <DashboardHome userName={profileData.nombre} />
        )}

      </main>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user}
        onUpdate={handleProfileUpdate}
      />

    </div>
  )
}