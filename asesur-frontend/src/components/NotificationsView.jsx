import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient' // Asegúrate que esta ruta sea correcta

export default function NotificationsView({ user }) {
  const [data, setData] = useState({ email: '', upcoming: [] })
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/api/notificaciones')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setNewEmail(d.email || '')
        setLoading(false)
      })
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!password) return alert("Ingresa tu contraseña para confirmar")

    try {
        // 1. VERIFICACIÓN DE SEGURIDAD (FRONTEND)
        // Intentamos iniciar sesión con la contraseña ingresada.
        // Si la contraseña es incorrecta, Supabase lanzará un error aquí.
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email, // Usamos el email del usuario logueado
            password: password
        })

        if (authError) {
            alert("⛔ Contraseña incorrecta. No se puede autorizar el cambio.")
            return
        }

        // 2. SI LA CONTRASEÑA ES CORRECTA, LLAMAMOS AL BACKEND
        const res = await fetch('http://localhost:3000/api/notificaciones/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                newEmail,
                // Ya no enviamos la contraseña al backend, ya verificamos que es él.
            })
        })

        const response = await res.json()
        
        if (res.ok) {
            alert("✅ " + response.message)
            setPassword('') 
            setData(prev => ({ ...prev, email: newEmail }))
        } else {
            alert("Error del servidor: " + response.error)
        }

    } catch (error) {
        console.error(error)
        alert("Ocurrió un error inesperado")
    }
  }

  // Calculadora de días
  const getDaysLeft = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) return <div style={{padding:'40px'}}>Cargando...</div>

  return (
    <div style={{maxWidth:'1000px', margin:'0 auto'}}>
      <h2 style={{color:'#0f172a'}}>🔔 Centro de Notificaciones y Cobranza</h2>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'30px'}}>
        
        {/* IZQUIERDA: MONITOR */}
        <div style={{background:'white', padding:'25px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
          <h3 style={{marginTop:0, color:'#b91c1c'}}>⚠️ Próximos Vencimientos (Monitor)</h3>
          <p style={{fontSize:'13px', color:'#64748b'}}>El sistema avisará por correo automáticamente cuando falten 15 días.</p>
          
          <div style={{maxHeight:'400px', overflowY:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
              <thead>
                <tr style={{textAlign:'left', color:'#64748b', borderBottom:'1px solid #e2e8f0'}}>
                  <th style={{padding:'10px'}}>Días Restantes</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map(p => {
                  const days = getDaysLeft(p.fecha_vencimiento_recibo)
                  return (
                    <tr key={p.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                      <td style={{padding:'10px'}}>
                        <span style={{
                          background: days === 15 ? '#fef08a' : days < 15 ? '#fecaca' : '#e0f2fe',
                          color: days === 15 ? '#854d0e' : days < 15 ? '#991b1b' : '#075985',
                          padding:'3px 8px', borderRadius:'12px', fontWeight:'bold', fontSize:'11px'
                        }}>
                          {days} días
                        </span>
                      </td>
                      <td>
                        <div style={{fontWeight:'bold'}}>{p.clientes?.nombre} {p.clientes?.apellido}</div>
                        <div style={{fontSize:'11px', color:'#94a3b8'}}>{p.aseguradora} - {p.numero_poliza}</div>
                      </td>
                      <td style={{fontWeight:'bold'}}>${p.prima_total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DERECHA: CONFIGURACIÓN */}
        <div style={{background:'white', padding:'25px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)', height:'fit-content'}}>
          <h3 style={{marginTop:0, color:'#1e293b'}}>⚙️ Configuración de Envío</h3>
          
          <form onSubmit={handleUpdate} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
            <div>
              <label style={{display:'block', fontSize:'12px', fontWeight:'bold', color:'#475569', marginBottom:'5px'}}>Correo del Equipo</label>
              <input 
                type="email" 
                value={newEmail} 
                onChange={e=>setNewEmail(e.target.value)} 
                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                required
              />
            </div>

            <div style={{padding:'15px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
              <label style={{display:'block', fontSize:'12px', fontWeight:'bold', color:'#dc2626', marginBottom:'5px'}}>🔒 Seguridad Requerida</label>
              <input 
                type="password" 
                placeholder="Contraseña de Administrador"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                required
              />
            </div>

            <button type="submit" style={{padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>
              Guardar Cambios
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}