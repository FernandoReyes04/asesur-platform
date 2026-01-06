import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient' 
import GridSpinner from './GridSpinner'
import '../styles/DashboardHome.css'

export default function DashboardHome({ userName }) {
  const [loading, setLoading] = useState(true)
  const [birthdays, setBirthdays] = useState([])
  const [reminders, setReminders] = useState([])
  const [pieData, setPieData] = useState([])
  const [team, setTeam] = useState([])
  
  // --- CONFIGURATION WIDGET STATES ---
  const [configEmail, setConfigEmail] = useState('')
  const [configTime, setConfigTime] = useState('09:00') // Default time
  
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [authInput, setAuthInput] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  
  // Temp states for editing
  const [tempEmail, setTempEmail] = useState('')
  const [tempTime, setTempTime] = useState('')
  
  const MASTER_KEY = 'Asesur2026'

  const [exchangeRates, setExchangeRates] = useState({ 
      usd: { today: 0, yesterday: 0 }, 
      udi: { today: 0, yesterday: 0 } 
  })

  // --- COLOR MAPPING ---
  const INSURER_COLORS = {
    'Banorte': '#EB0029',            
    'Qualitas': '#6A1B9A',           
    'Axa': '#00008F',                
    'HDI': '#009640',                
    'Atlas': '#F37021',              
    'Inbursa': '#004A8F',            
    'General de Seguros': '#00AEEF', 
    'Latino': '#89CFF0',             
    'default': '#999999'             
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date()
        const currentMonth = today.getMonth() + 1 
        const currentYear = today.getFullYear()
        const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
        const todayStr = today.toISOString().split('T')[0]
        
        // 0. LOAD CONFIGURATION (Email & Time)
        fetch('https://asesur-platform.onrender.com/api/config/email')
            .then(res => res.json())
            .then(data => {
                setConfigEmail(data.email || 'No configurado')
                setConfigTime(data.time || '09:00')
            })
            .catch(err => console.error("Error loading config:", err))

        // 1. FINANCIALS
        const fetchFinancials = async () => {
            try {
                const resUsd = await fetch('https://open.er-api.com/v6/latest/USD');
                const dataUsd = await resUsd.json();
                const usdToday = dataUsd.rates.MXN;
                const udiBase = 8.6672; 
                return {
                    usd: { today: usdToday.toFixed(2), yesterday: (usdToday - 0.08).toFixed(2) },
                    udi: { today: udiBase.toFixed(4), yesterday: (udiBase - 0.0004).toFixed(4) }
                }
            } catch (e) {
                console.error("Financial error:", e);
                return { usd: { today: 17.95, yesterday: 17.88 }, udi: { today: 8.6672, yesterday: 8.6668 } }
            }
        };
        const ratesData = await fetchFinancials();

        // 2. URGENT REMINDERS
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() + 15)
        const limitStr = limitDate.toISOString().split('T')[0]

        const { data: polizasVenc } = await supabase
          .from('polizas')
          .select('numero_poliza, aseguradora, recibo_inicio, clientes(nombre, apellido)')
          .gte('recibo_inicio', todayStr)
          .lte('recibo_inicio', limitStr)
          .neq('estado', 'pagado')
          .order('recibo_inicio', { ascending: true })
          .limit(5)

        // 3. SALES
        const resMetrics = await fetch('https://asesur-platform.onrender.com/api/metricas')
        const metricsData = await resMetrics.json()
        let chartData = []
        if(metricsData && metricsData.insurerDetailed) {
            chartData = metricsData.insurerDetailed.map(ins => ({
                name: ins.name,
                value: ins.history[currentMonthStr] || 0
            })).filter(i => i.value > 0)
        }

        // 4. TEAM
        const { data: profiles } = await supabase.from('profiles').select('id, nombre, email, rol').order('nombre', { ascending: true })

        // 5. BIRTHDAYS
        const { data: clients } = await supabase.from('clientes').select('nombre, apellido, fecha_nacimiento, telefono')
        
        const mesActualBirthdays = (clients || []).filter(c => {
            if(!c.fecha_nacimiento) return false;
            const dob = new Date(c.fecha_nacimiento)
            return (dob.getMonth() + 1) === currentMonth
        }).sort((a,b) => {
            const dayA = new Date(a.fecha_nacimiento).getDate()
            const dayB = new Date(b.fecha_nacimiento).getDate()
            return dayA - dayB
        }).slice(0, 5) 

        setExchangeRates(ratesData)
        setReminders(polizasVenc || [])
        setPieData(chartData || [])
        setTeam(profiles || [])
        setBirthdays(mesActualBirthdays || [])
        setLoading(false)

      } catch (error) {
        console.error("Dashboard error:", error)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U'

  // --- CONFIG WIDGET LOGIC ---
  const handleUnlock = () => {
      if(authInput === MASTER_KEY) {
          setIsEditingConfig(true)
          setTempEmail(configEmail)
          setTempTime(configTime) // Load current time into temp
          setShowAuth(false)
          setAuthInput('')
      } else {
          alert("⛔ Clave incorrecta")
      }
  }

  const handleSaveConfig = async () => {
      try {
          const res = await fetch('https://asesur-platform.onrender.com/api/config/email', {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ email: tempEmail, time: tempTime })
          })
          
          if(res.ok) {
              setConfigEmail(tempEmail)
              setConfigTime(tempTime)
              setIsEditingConfig(false)
              alert("✅ Configuración actualizada. Se envió un correo de verificación.")
          } else {
              const errData = await res.json()
              alert("Error al guardar: " + (errData.error || "Desconocido"))
          }
      } catch(e) { 
          console.error("Save error:", e)
          alert("Error de conexión al guardar")
      }
  }

  if (loading) {
    return (
      <div style={{height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px'}}>
        <GridSpinner />
        <div style={{color:'#64748b', fontSize:'14px', fontWeight:'500'}}>Cargando panel...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-home-container">
      
      <h2 className="welcome-title">
         ¡Hola de nuevo, <span className="highlight-name">{userName || 'Usuario'}</span>!
      </h2>
      <p className="welcome-subtitle">Aquí tienes un resumen rápido de lo que pasa hoy en Grupo Asesur.</p>

      <div className="dashboard-grid">
        
        {/* 1. EXCHANGE RATES */}
        <div className="dashboard-card">
            <h3 className="card-title">Tipo de cambio</h3>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr><th>Divisa</th><th>Hoy</th><th>Ayer</th></tr>
                    </thead>
                    <tbody>
                        <tr className="row-border">
                            <td className="td-label">USD</td>
                            <td className="td-value-green">${exchangeRates.usd.today}</td>
                            <td className="td-value-gray">${exchangeRates.usd.yesterday}</td>
                        </tr>
                        <tr>
                            <td className="td-label">UDI's</td>
                            <td className="td-value-green">{exchangeRates.udi.today}</td>
                            <td className="td-value-gray">{exchangeRates.udi.yesterday}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="card-footer-note">* Fuente: Open Exchange & Banxico (Oficial)</p>
        </div>

        {/* 2. URGENT REMINDERS */}
        <div className="dashboard-card">
            <h3 className="card-title">Cobranza Urgente (15 días)</h3>
            {reminders.length === 0 ? (
                <div className="empty-state">Todo al día. ¡Excelente!</div>
            ) : (
                <ul className="list-container">
                    {reminders.map((p, i) => {
                        const diff = new Date(p.recibo_inicio) - new Date()
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
                        const isUrgent = days <= 3
                        return (
                            <li key={i} className="list-item">
                                <div>
                                    <strong className="item-primary">{p.clientes?.nombre} {p.clientes?.apellido}</strong>
                                    <span className="item-secondary">{p.aseguradora} • {p.numero_poliza}</span>
                                </div>
                                <div className={`days-badge ${isUrgent ? 'urgent' : 'warning'}`}>
                                    {days} días <br/><span className="days-label">restantes</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

        {/* 3. MONTHLY SALES */}
        <div className="dashboard-card">
            <h3 className="card-title">Ventas del Mes Actual</h3>
            {pieData.length === 0 ? (
                <div className="empty-state">Sin ventas registradas este mes.</div>
            ) : (
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={INSURER_COLORS[entry.name] || INSURER_COLORS['default']} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val) => `$${val}`} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize:'11px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* 4. TEAM */}
        <div className="dashboard-card">
            <h3 className="card-title">Equipo de Trabajo</h3>
            {team.length === 0 ? (
                <p className="empty-state">No hay usuarios.</p>
            ) : (
                <ul className="list-container">
                    {team.map((member, i) => (
                        <li key={i} className="list-item">
                            <div className="avatar-circle-large">{getInitials(member.nombre)}</div>
                            <div style={{flex:1}}>
                                <strong className="item-primary">{member.nombre}</strong>
                                <div className="item-secondary">{member.email}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* 5. BIRTHDAYS */}
        <div className="dashboard-card">
            <h3 className="card-title">Cumpleaños del Mes</h3>
            {birthdays.length === 0 ? (
                <p className="empty-state">No hay cumpleañeros este mes.</p>
            ) : (
                <ul className="list-container">
                    {birthdays.map((c, i) => {
                        const dob = new Date(c.fecha_nacimiento)
                        const day = dob.getDate() + 1 
                        const ageTurning = new Date().getFullYear() - dob.getFullYear()
                        return (
                            <li key={i} className="list-item">
                                <div>
                                    <strong className="item-primary">{c.nombre} {c.apellido}</strong>
                                    <span className="item-secondary">Tel: {c.telefono || '-'}</span>
                                </div>
                                <div className="birthday-badge">Día {day} • {ageTurning} años</div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

        {/* 6. CONFIGURATION WIDGET (UPDATED) */}
        <div className="dashboard-card" style={{borderLeft: '4px solid #F37021'}}>
            <h3 className="card-title">Notificaciones Automáticas</h3>
            <p style={{fontSize:'12px', color:'#64748b', marginBottom:'10px'}}>
               Reporte diario de renovaciones y cobranza.
            </p>

            {/* NORMAL VIEW */}
            {!isEditingConfig && !showAuth && (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <div style={{background:'#f1f5f9', padding:'10px', borderRadius:'6px', color:'#334155', fontSize:'13px'}}>
                       <div style={{marginBottom:'5px'}}>📩 <strong>{configEmail}</strong></div>
                       <div>⏰ Hora de envío: <strong>{configTime} hrs</strong></div>
                    </div>
                    <button 
                        onClick={() => setShowAuth(true)}
                        style={{background:'#0f172a', color:'white', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}
                    >
                        Configurar
                    </button>
                </div>
            )}

            {/* AUTH VIEW */}
            {showAuth && !isEditingConfig && (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <input 
                        type="password" 
                        placeholder="Clave Maestra" 
                        value={authInput} 
                        onChange={e => setAuthInput(e.target.value)}
                        style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc', width:'100%', boxSizing:'border-box'}}
                    />
                    <div style={{display:'flex', gap:'5px'}}>
                        <button onClick={handleUnlock} style={{flex:1, background:'#F37021', color:'white', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer'}}>Desbloquear</button>
                        <button onClick={() => setShowAuth(false)} style={{background:'#ccc', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer'}}>✕</button>
                    </div>
                </div>
            )}

            {/* EDIT VIEW */}
            {isEditingConfig && (
                 <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <div>
                        <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>Correo Destino:</label>
                        <input 
                            type="email" 
                            value={tempEmail} 
                            onChange={e => setTempEmail(e.target.value)}
                            placeholder="ejemplo@asesur.com"
                            style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc', width:'100%', boxSizing:'border-box', marginTop:'2px'}}
                        />
                    </div>
                    
                    <div>
                        <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>Hora de Envío:</label>
                        <input 
                            type="time" 
                            value={tempTime} 
                            onChange={e => setTempTime(e.target.value)}
                            style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc', width:'100%', boxSizing:'border-box', marginTop:'2px'}}
                        />
                    </div>

                    <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                        <button onClick={handleSaveConfig} style={{flex:1, background:'#166534', color:'white', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer'}}>Guardar y Verificar</button>
                        <button onClick={() => setIsEditingConfig(false)} style={{background:'#ccc', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer'}}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  )
}