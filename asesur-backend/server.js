require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet') 
const rateLimit = require('express-rate-limit') 

const authRoutes = require('./src/routes/authRoutes')
const clientRoutes = require('./src/routes/clientRoutes')
const policyRoutes = require('./src/routes/policyRoutes')
const recordsRoutes = require('./src/routes/recordsRoutes')
const metricsRoutes = require('./src/routes/metricsRoutes')
const notificationRoutes = require('./src/routes/notificationRoutes')
const { initCronJob } = require('./src/controllers/notificationController')

const app = express()
// MEJORA: Render te da un puerto en process.env.PORT, úsalo si existe.
const PORT = process.env.PORT || 3000 

// --- CAPA DE SEGURIDAD 1: CABECERAS HTTP ---
app.use(helmet())

// --- CAPA DE SEGURIDAD 2: RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: '⛔ Demasiados intentos, intenta de nuevo en 15 minutos.'
})
app.use(limiter) 

// --- CAPA DE SEGURIDAD 3: CORS (ACTUALIZADO) ---
app.use(cors({
  origin: [
    'http://localhost:5173',               // Tu entorno local
    'https://FernandoReyes04.github.io'    // Tu entorno en Producción (GitHub Pages)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json()) 

// RUTAS
app.use('/api', authRoutes)
app.use('/api/clientes', clientRoutes)
app.use('/api/polizas', policyRoutes)
app.use('/api/registros', recordsRoutes)
app.use('/api/metricas', metricsRoutes)
app.use('/api/notificaciones', notificationRoutes)
app.use('/api/config', require('./src/routes/configRoutes'))

// Iniciar el reloj
initCronJob()

app.listen(PORT, () => {
  console.log(`🛡️ Servidor BLINDADO corriendo en el puerto ${PORT}`)
})