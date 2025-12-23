require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet') // <--- 1. IMPORTAR HELMET
const rateLimit = require('express-rate-limit') // <--- 2. IMPORTAR RATE LIMIT

const authRoutes = require('./src/routes/authRoutes')
const clientRoutes = require('./src/routes/clientRoutes')
const policyRoutes = require('./src/routes/policyRoutes')
const recordsRoutes = require('./src/routes/recordsRoutes')
const metricsRoutes = require('./src/routes/metricsRoutes')

const app = express()
const PORT = 3000

// --- CAPA DE SEGURIDAD 1: CABECERAS HTTP (HELMET) ---
// Esto oculta que usas Express y protege contra ataques XSS y Sniffing
app.use(helmet())

// --- CAPA DE SEGURIDAD 2: RATE LIMITING (FUERZA BRUTA) ---
// Si una IP hace más de 100 peticiones en 15 minutos, la bloqueamos.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP
  message: '⛔ Demasiados intentos desde esta IP, por favor intenta de nuevo en 15 minutos.'
})
app.use(limiter) // Aplicar a todas las rutas

// --- CAPA DE SEGURIDAD 3: CORS RESTRICTIVO ---
// Solo permitimos que TU Frontend hable con el Backend. Nadie más.
app.use(cors({
  origin: 'http://localhost:5173', // <--- CAMBIA ESTO AL DOMINIO REAL CUANDO SUBAS A PRODUCCIÓN
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json()) // Protección básica contra payloads gigantes

// RUTAS
app.use('/api', authRoutes)
app.use('/api/clientes', clientRoutes)
app.use('/api/polizas', policyRoutes)
app.use('/api/registros', recordsRoutes)
app.use('/api/metricas', metricsRoutes)

app.listen(PORT, () => {
  console.log(`🛡️ Servidor BLINDADO corriendo en http://localhost:${PORT}`)
})