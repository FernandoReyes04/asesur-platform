import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient' 

export default function DashboardHome() {
  const [loading, setLoading] = useState(true)
  const [birthdays, setBirthdays] = useState([])
  const [reminders, setReminders] = useState([])
  const [pieData, setPieData] = useState([])

  useEffect(() => {
    // Definimos la función DENTRO del efecto para evitar warnings de ESLint
    const fetchData = async () => {
      try {
        const today = new Date()
        const currentMonth = today.getMonth() + 1 
        const currentYear = today.getFullYear()
        const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
        const todayStr = today.toISOString().split('T')[0]
        
        // 1. CUMPLEAÑOS DEL MES
        const { data: clients } = await supabase
          .from('clientes')
          .select('nombre, apellido, fecha_nacimiento, telefono')
        
        const mesActualBirthdays = clients.filter(c => {
            if(!c.fecha_nacimiento) return false;
            const dob = new Date(c.fecha_nacimiento)
            return (dob.getMonth() + 1) === currentMonth
        }).sort((a,b) => {
            const dayA = new Date(a.fecha_nacimiento).getDate()
            const dayB = new Date(b.fecha_nacimiento).getDate()
            return dayA - dayB
        }).slice(0, 5) 

        // 2. MINI RECORDATORIOS (Próximos 15 días)
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() + 15)
        const limitStr = limitDate.toISOString().split('T')[0]

        const { data: polizasVenc } = await supabase
          .from('polizas')
          .select('numero_poliza, aseguradora, fecha_vencimiento_recibo, clientes(nombre, apellido)')
          .gte('fecha_vencimiento_recibo', todayStr)
          .lte('fecha_vencimiento_recibo', limitStr)
          .neq('estado', 'pagado')
          .order('fecha_vencimiento_recibo', { ascending: true })
          .limit(5)

        // 3. DATOS PARA PASTEL (Mes Actual)
        const resMetrics = await fetch('http://localhost:3000/api/metricas')
        const metricsData = await resMetrics.json()
        
        let chartData = []
        if(metricsData.insurerDetailed) {
            chartData = metricsData.insurerDetailed.map(ins => ({
                name: ins.name,
                value: ins.history[currentMonthStr] || 0
            })).filter(i => i.value > 0)
        }

        setBirthdays(mesActualBirthdays)
        setReminders(polizasVenc)
        setPieData(chartData)
        setLoading(false)

      } catch (error) {
        console.error("Error cargando dashboard:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  if (loading) return <div style={{padding:'40px', color:'#64748b'}}>Cargando panel...</div>

  const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '300px' }
  const titleStyle = { margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a', display:'flex', alignItems:'center', gap:'8px' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{color:'#0f172a', marginBottom:'10px'}}>👋 ¡Hola de nuevo!</h2>
      <p style={{color:'#64748b', marginTop:0, marginBottom:'30px'}}>Aquí tienes un resumen rápido de lo que pasa hoy en Asesur.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom:'30px' }}>
        
        {/* 1. CUMPLEAÑOS */}
        <div style={cardStyle}>
            <h3 style={titleStyle}>🎂 Cumpleaños del Mes</h3>
            {birthdays.length === 0 ? (
                <p style={{fontSize:'13px', color:'#94a3b8', fontStyle:'italic'}}>No hay cumpleañeros este mes.</p>
            ) : (
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                    {birthdays.map((c, i) => {
                        const dob = new Date(c.fecha_nacimiento)
                        // Calculamos día (+1 por UTC) y edad a cumplir
                        const day = dob.getDate() + 1 
                        const ageTurning = new Date().getFullYear() - dob.getFullYear()

                        return (
                            <li key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9', fontSize:'13px'}}>
                                <div>
                                    <strong style={{color:'#1e293b', display:'block'}}>{c.nombre} {c.apellido}</strong>
                                    <span style={{fontSize:'11px', color:'#64748b'}}>Tel: {c.telefono || '-'}</span>
                                </div>
                                <div style={{
                                    background:'#fdf2f8', 
                                    color:'#2a7ad6ff', 
                                    padding:'4px 10px', 
                                    borderRadius:'15px', 
                                    fontWeight:'bold', 
                                    fontSize:'11px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Día {day} • {ageTurning} años
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

        {/* 2. COBRANZA RÁPIDA */}
        <div style={cardStyle}>
            <h3 style={titleStyle}>🔔 Cobranza Urgente (15 días)</h3>
            {reminders.length === 0 ? (
                <p style={{fontSize:'13px', color:'#94a3b8', fontStyle:'italic'}}>Todo al día. ¡Buen trabajo!</p>
            ) : (
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                    {reminders.map((p, i) => {
                        const diff = new Date(p.fecha_vencimiento_recibo) - new Date()
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
                        const color = days <= 3 ? '#ef4444' : '#f59e0b'
                        
                        return (
                            <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f1f5f9', fontSize:'13px'}}>
                                <div>
                                    <strong style={{display:'block', color:'#334155'}}>{p.clientes.nombre} {p.clientes.apellido}</strong>
                                    <span style={{fontSize:'11px', color:'#64748b'}}>{p.aseguradora} • {p.numero_poliza}</span>
                                </div>
                                <div style={{color: color, fontWeight:'bold', fontSize:'12px', textAlign:'right'}}>
                                    {days} días <br/>
                                    <span style={{fontSize:'10px', color:'#94a3b8', fontWeight:'normal'}}>restantes</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

        {/* 3. SHARE DE MERCADO (MES ACTUAL) */}
        <div style={cardStyle}>
            <h3 style={titleStyle}>📊 Ventas del Mes Actual</h3>
            {pieData.length === 0 ? (
                <div style={{height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'13px'}}>
                    Sin ventas registradas este mes.
                </div>
            ) : (
                <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={pieData} 
                                cx="50%" cy="50%" 
                                innerRadius={50} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
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

      </div>
    </div>
  )
}