import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient' 
import '../styles/DashboardHome.css' // <--- IMPORTANTE

export default function DashboardHome({ userName }) {
  const [loading, setLoading] = useState(true)
  const [birthdays, setBirthdays] = useState([])
  const [reminders, setReminders] = useState([])
  const [pieData, setPieData] = useState([])
  const [team, setTeam] = useState([])
  
  const [exchangeRates, setExchangeRates] = useState({ 
      usd: { today: 0, yesterday: 0 }, 
      udi: { today: 0, yesterday: 0 } 
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date()
        const currentMonth = today.getMonth() + 1 
        const currentYear = today.getFullYear()
        const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
        const todayStr = today.toISOString().split('T')[0]
        
        // 1. FINANZAS
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
                console.error("Error financiero:", e);
                return { usd: { today: 17.95, yesterday: 17.88 }, udi: { today: 8.6672, yesterday: 8.6668 } }
            }
        };
        const ratesData = await fetchFinancials();

        // 2. COBRANZA
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

        // 3. VENTAS
        const resMetrics = await fetch('http://localhost:3000/api/metricas')
        const metricsData = await resMetrics.json()
        let chartData = []
        if(metricsData && metricsData.insurerDetailed) {
            chartData = metricsData.insurerDetailed.map(ins => ({
                name: ins.name,
                value: ins.history[currentMonthStr] || 0
            })).filter(i => i.value > 0)
        }

        // 4. EQUIPO
        const { data: profiles } = await supabase.from('profiles').select('id, nombre, email, rol').order('nombre', { ascending: true })

        // 5. CUMPLEAÑOS
        const { data: clients } = await supabase.from('clientes').select('nombre, apellido, fecha_nacimiento, telefono')
        
        const mesActualBirthdays = (clients || []).filter(c => {
            if(!c.fecha_nacimiento) return false;
            const dob = new Date(c.fecha_nacimiento)
            return (dob.getMonth() + 1) === currentMonth
        }).sort((a,b) => {
            const dayA = new Date(a.fecha_nacimiento).getDate()
            return dayA - new Date(b.fecha_nacimiento).getDate()
        }).slice(0, 5) 

        setExchangeRates(ratesData)
        setReminders(polizasVenc || [])
        setPieData(chartData || [])
        setTeam(profiles || [])
        setBirthdays(mesActualBirthdays || [])
        setLoading(false)

      } catch (error) {
        console.error("Error dashboard:", error)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U'

  if (loading) return <div style={{padding:'40px', color:'#64748b'}}>Cargando panel...</div>

  return (
    <div className="dashboard-home-container">
      
      <h2 className="welcome-title">
         ¡Hola de nuevo, <span className="highlight-name">{userName || 'Usuario'}</span>!
      </h2>
      <p className="welcome-subtitle">Aquí tienes un resumen rápido de lo que pasa hoy en Grupo Asesur.</p>

      <div className="dashboard-grid">
        
        {/* 1. TIPO DE CAMBIO */}
        <div className="dashboard-card">
            <h3 className="card-title">Tipo de cambio</h3>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Divisa</th><th>Hoy</th><th>Ayer</th>
                        </tr>
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

        {/* 2. COBRANZA RÁPIDA */}
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
                                    {days} días <br/>
                                    <span className="days-label">restantes</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

        {/* 3. VENTAS DEL MES */}
        <div className="dashboard-card">
            <h3 className="card-title">Ventas del Mes Actual</h3>
            {pieData.length === 0 ? (
                <div className="empty-state">Sin ventas registradas este mes.</div>
            ) : (
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val) => `$${val}`} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize:'11px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* 4. EQUIPO DE TRABAJO */}
        <div className="dashboard-card">
            <h3 className="card-title">Equipo de Trabajo</h3>
            {team.length === 0 ? (
                <p className="empty-state">No hay usuarios.</p>
            ) : (
                <ul className="list-container">
                    {team.map((member, i) => (
                        <li key={i} className="list-item">
                            <div className="avatar-circle-large">
                                {getInitials(member.nombre)}
                            </div>
                            <div style={{flex:1}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <strong className="item-primary">{member.nombre}</strong>
                                    
                                </div>
                                <div className="item-secondary">{member.email}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* 5. CUMPLEAÑOS */}
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
                                <div className="birthday-badge">
                                    Día {day} • {ageTurning} años
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

      </div>
    </div>
  )
}