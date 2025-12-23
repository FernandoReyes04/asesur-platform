import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient' 
import { dataService } from '../services/dataService'
import ClientManagement from './ClientManagement'
import PolicyManagement from './PolicyManagement'
import RecordsView from './RecordsView' 
import MetricsView from './MetricsView'

export default function Dashboard({ user, onLogout }) {
  // Estados de Vista
  const [currentView, setCurrentView] = useState('home')
  const [data, setData] = useState({ clientesHoy: [], ultimosTramites: [], agentes: [] })
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // --- OPTIMIZACIÓN DE NOMBRE (CERO DELAY) ---
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem('asesur_user_name') || ''
  })

  // Estado para el Modal
  const [selectedClient, setSelectedClient] = useState(null)

  // Carga datos del Dashboard
  useEffect(() => {
    if (currentView === 'home') {
       dataService.getDashboardData().then(setData).finally(() => setLoading(false))
    }
  }, [currentView])

  // --- RECUPERAR NOMBRE Y GUARDAR EN CACHÉ ---
  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user || !user.id) return

      try {
        // CORRECCIÓN AQUÍ: Quitamos 'error' porque no lo usábamos. Solo pedimos 'data'.
        const { data } = await supabase
          .from('profiles')
          .select('nombre')
          .eq('id', user.id)
          .single()

        if (data && data.nombre) {
          // Si el nombre es diferente al que tenemos, actualizamos
          if (data.nombre !== profileName) {
            setProfileName(data.nombre)
            localStorage.setItem('asesur_user_name', data.nombre)
          }
        }
      } catch (error) {
        // Este error SÍ se usa (es el del try/catch)
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
  const displayName = profileName || user.user_metadata?.nombre || '...'

  // Estilos
  const btnStyle = (viewName) => ({
    display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '12px',
    background: currentView === viewName ? '#1e293b' : 'transparent',
    border: 'none', color: currentView === viewName ? '#38bdf8' : '#94a3b8',
    cursor: 'pointer', fontSize: '15px', borderRadius: '6px', marginBottom: '5px'
  })

  const itemStyle = {
    padding: '15px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }

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
               currentView === 'polizas' ? 'Gestión de Pólizas' : 'Consulta de Registros'}
            </h1>
            <p style={{margin:0, fontSize:'13px', color:'#64748b'}}>Bienvenido al sistema.</p>
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
        ) : (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
             <div style={{background:'white', padding:'25px', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <h3 style={{marginTop:0, color:'#1e293b'}}>📅 Actividad Reciente</h3>
                {loading ? 'Cargando...' : data.ultimosTramites.length === 0 ? <p style={{color:'#94a3b8'}}>No hay registros recientes.</p> : (
                  <div style={{display:'flex', flexDirection:'column'}}>
                    {data.ultimosTramites.map(t => (
                      <div 
                        key={t.id} 
                        style={itemStyle}
                        onClick={() => setSelectedClient(t)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div>
                          <div style={{fontWeight:'600', color:'#334155'}}>{t.nombre} {t.apellido}</div>
                          <div style={{fontSize:'12px', color:'#94a3b8'}}>Registrado el: {new Date(t.created_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{fontSize:'12px', color:'#3b82f6', background:'#eff6ff', padding:'4px 8px', borderRadius:'10px'}}>Ver Info</span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* MODAL */}
      {selectedClient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }} onClick={() => setSelectedClient(null)}>
          
          <div 
            style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '450px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()} 
          >
            <button onClick={() => setSelectedClient(null)} style={{position:'absolute', top:'15px', right:'15px', border:'none', background:'transparent', fontSize:'20px', cursor:'pointer', color:'#64748b'}}>✕</button>

            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <div style={{width:'60px', height:'60px', background:'#eff6ff', color:'#3b82f6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', margin:'0 auto 10px auto'}}>👤</div>
              <h2 style={{margin:0, color:'#1e293b'}}>{selectedClient.nombre} {selectedClient.apellido}</h2>
              <p style={{margin:'5px 0 0 0', color:'#64748b', fontSize:'14px'}}>ID: {selectedClient.id.split('-')[0]}</p>
            </div>

            <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}>
               <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                 <span style={{color:'#64748b', fontSize:'13px'}}>Fecha Nacimiento:</span>
                 <span style={{fontWeight:'500', color:'#334155'}}>{selectedClient.fecha_nacimiento}</span>
               </div>
               <div style={{display:'flex', justifyContent:'space-between'}}>
                 <span style={{color:'#64748b', fontSize:'13px'}}>Estado:</span>
                 <span style={{fontWeight:'bold', color: selectedClient.estado === 'pagado' ? '#10b981' : '#f59e0b', textTransform:'uppercase', fontSize:'12px'}}>
                   {selectedClient.estado || 'Pendiente'}
                 </span>
               </div>
            </div>

            {selectedClient.ine_url ? (
              <a href={selectedClient.ine_url} target="_blank" rel="noreferrer" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', padding:'12px', background:'#0f172a', color:'white', textDecoration:'none', borderRadius:'8px', fontWeight:'bold', boxSizing: 'border-box'}}>
                📄 Ver Documento INE
              </a>
            ) : (
              <p style={{textAlign:'center', color:'#ef4444', fontSize:'13px'}}>⚠️ Sin documento adjunto</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}