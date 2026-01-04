import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient' 
import ClientManagement from './ClientManagement'
import PolicyForm from './PolicyForm'
import PolicyList from './PolicyList'
import RecordsView from './RecordsView' 
import MetricsView from './MetricsView'
import HistoryMetricsView from './HistoryMetricsView' 
import NotificationsView from './NotificationsView'
import DashboardHome from './DashboardHome'
import ProfileModal from './ProfileModal'
import RenewalsView from './RenewalsView'

import panelIconPanel from '../icons/panel.png'
import panelIconClient from '../icons/cliente.png'
import panelIconPolicies from '../icons/papel.png'
import panelIconMore from '../icons/mas.png'
import panelIconWallet from '../icons/cartera.png'
import panelIconFolder from '../icons/carpeta.png'
import panelIconStadistics from '../icons/tendencia.png'
import panelIconConfig from '../icons/configuracion.png'
import panelIconRecibe from '../icons/recibo.png'
import panelIconCircle from '../icons/circulo.png'

// IMPORTAMOS LOS ESTILOS
import '../styles/Dashboard.css'

export default function Dashboard({ user, onLogout }) {
  // Estados de Vista
  const [currentView, setCurrentView] = useState('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  // Estados de Menús Desplegables
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showPoliciesMenu, setShowPoliciesMenu] = useState(false) 

  // Estado Perfil
  const [profileData, setProfileData] = useState({
    nombre: localStorage.getItem('asesur_user_name') || 'Usuario',
    avatar_url: null
  })

  // Cargar Perfil
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

  // --- HELPER PARA CLASES ACTIVAS ---
  // Esto reemplaza las funciones btnStyle y subBtnStyle
  const getNavClass = (viewName) => {
      return `nav-btn ${currentView === viewName ? 'active' : ''}`
  }
  
  // Para los botones padres que se iluminan si un hijo está activo
  const getParentNavClass = (isActiveCondition) => {
      return `nav-btn nav-btn-dropdown ${isActiveCondition ? 'active' : ''}`
  }

  const getSubNavClass = (viewName) => {
      return `nav-btn sub-nav-btn ${currentView === viewName ? 'active' : ''}`
  }

  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div>
           <h2 onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="sidebar-header">
             {isSidebarOpen ? 'ASESUR' : 'A'}
           </h2>
           
           <nav className="nav-menu">
             <button onClick={() => setCurrentView('home')} className={getNavClass('home')}>
              <img src={panelIconPanel} alt="Panel" className="nav-icon" /> 
              {isSidebarOpen && <span>Panel General</span>}
            </button>
             
             <button onClick={() => setCurrentView('register')} className={getNavClass('register')}>
               <img src={panelIconClient} alt="Clientes" className="nav-icon" />
               {isSidebarOpen && <span>Clientes</span>}
             </button>

             {/* --- MENÚ PÓLIZAS --- */}
             <button 
                onClick={() => {
                    if(!isSidebarOpen) setIsSidebarOpen(true);
                    setShowPoliciesMenu(!showPoliciesMenu);
                }} 
                className={getParentNavClass(currentView === 'polizas-nueva' || currentView === 'polizas-cartera')}
             >
               <div className="nav-icon-container">
                    <img src={panelIconPolicies} alt="Pólizas" className="nav-icon" />
                   {isSidebarOpen && <span>Gestión de Pólizas</span>}
               </div>
               {isSidebarOpen && <span className="arrow-icon">{showPoliciesMenu ? '▼' : '▶'}</span>}
             </button>

             {isSidebarOpen && showPoliciesMenu && (
                 <div className="submenu-container">
                     <button onClick={() => setCurrentView('polizas-nueva')} className={getSubNavClass('polizas-nueva')}>
                        <img src={panelIconMore} alt="Nueva Póliza" className="nav-icon" /> Nueva Póliza
                     </button>
                     <button onClick={() => setCurrentView('polizas-cartera')} className={getSubNavClass('polizas-cartera')}>
                        <img src={panelIconWallet} alt="Cartera Pólizas" className="nav-icon" /> Cartera de Pólizas
                     </button>
                 </div>
             )}

             <button onClick={() => setCurrentView('registros')} className={getNavClass('registros')}>
                <img src={panelIconFolder} alt="Registros" className="nav-icon" />
               {isSidebarOpen && <span>Registros</span>}
             </button>
             
             {/* Reportes y métricas (incluye la vista de historial como activa) */}
             <button onClick={() => setCurrentView('metricas')} className={`nav-btn ${currentView === 'metricas' || currentView === 'history-metrics' ? 'active' : ''}`}>
                <img src={panelIconStadistics} alt="Reportes" className="nav-icon" />
               {isSidebarOpen && <span>Reportes</span>}
             </button>

             {/* --- MENÚ ADMINISTRACIÓN --- */}
             <button 
                onClick={() => {
                    if(!isSidebarOpen) setIsSidebarOpen(true); 
                    setShowAdminMenu(!showAdminMenu);
                }} 
                className={getParentNavClass(currentView === 'recibos' || currentView === 'renovaciones')}
             >
               <div className="nav-icon-container">
                    <img src={panelIconConfig} alt="Administración" className="nav-icon" />
                   {isSidebarOpen && <span>Cobranza</span>}
               </div>
               {isSidebarOpen && <span className="arrow-icon">{showAdminMenu ? '▼' : '▶'}</span>}
             </button>

             {isSidebarOpen && showAdminMenu && (
                 <div className="submenu-container">
                     <button onClick={() => setCurrentView('recibos')} className={getSubNavClass('recibos')}>
                        <img src={panelIconRecibe} alt="Recibos" className="nav-icon" /> Gestión de Recibos
                     </button>
                     <button onClick={() => setCurrentView('renovaciones')} className={getSubNavClass('renovaciones')}>
                        <img src={panelIconCircle} alt="Renovaciones" className="nav-icon" /> Gestión de Renovaciones
                     </button>
                 </div>
             )}

           </nav>
        </div>
        
        <button onClick={handleLogoutClick} className="logout-btn">
          {isSidebarOpen ? 'Cerrar Sesión' : '🚪'}
        </button>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        
        <div className="top-bar">
          <div>
            <h1 className="page-title">
              {/* TÍTULOS DINÁMICOS */}
              {currentView === 'home' ? 'Tablero de Control' : 
               currentView === 'register' ? 'Gestión de Clientes' : 
               currentView === 'polizas-nueva' ? 'Registro de Pólizas' : 
               currentView === 'polizas-cartera' ? 'Cartera de Pólizas' :
               currentView === 'registros' ? 'Consulta de Registros' :
               currentView === 'metricas' ? 'Reportes Financieros' : 
               currentView === 'history-metrics' ? 'Análisis Histórico' :
               currentView === 'recibos' ? 'Gestión de Recibos y Cobranza' :
               currentView === 'renovaciones' ? 'Gestión de Renovaciones' : 'Panel'}
            </h1>
            <p className="page-subtitle">Sistema Integral de Gestión Asesur</p>
          </div>
          
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div onClick={() => setIsProfileOpen(true)} className="profile-widget">
              <div 
                className="avatar-circle"
                style={{
                    backgroundImage: profileData.avatar_url ? `url(${profileData.avatar_url})` : 'none',
                }}
              >
                  {!profileData.avatar_url && '👤'}
              </div>
              <span className="profile-name">
                {profileData.nombre}
              </span>
            </div>
          </div>
        </div>

        {/* --- CONTROLADOR DE VISTAS --- */}
        {currentView === 'register' ? (
            <ClientManagement user={user} onSuccess={() => setCurrentView('home')} />
        ) : currentView === 'polizas-nueva' ? (
            <PolicyForm />
        ) : currentView === 'polizas-cartera' ? (
            <PolicyList />
        ) : currentView === 'registros' ? (
            <RecordsView />
        ) : currentView === 'metricas' ? (
            <MetricsView onViewHistory={() => setCurrentView('history-metrics')} />
        ) : currentView === 'history-metrics' ? (
            <HistoryMetricsView onBack={() => setCurrentView('metricas')} />
        ) : currentView === 'recibos' ? (
            <NotificationsView user={user} />
        ) : currentView === 'renovaciones' ? (
            <RenewalsView />
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