require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); 
const compression = require('compression'); 
const rateLimit = require('express-rate-limit'); 
const cluster = require('cluster'); 
const os = require('os'); 

// --- IMPORTACIONES DE RUTAS ---
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const policyRoutes = require('./src/routes/policyRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const recordsRoutes = require('./src/routes/recordsRoutes'); // <--- Si faltaba
const metricsRoutes = require('./src/routes/metricsRoutes'); // <--- Si faltaba
const configRoutes = require('./src/routes/configRoutes');   // <--- Si faltaba

// --- IMPORTACIÓN DE SERVICIOS ---
const notificationService = require('./src/services/notificationService');

// --- LÓGICA DE CLUSTERING (ROBUSTEZ) ---
const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === 'production';

// BLOQUE MAESTRO (Solo corre una vez en Producción)
if (isProduction && cluster.isPrimary) {
  console.log(`🚀 Maestro ${process.pid} está corriendo`);
  console.log(`🔥 Levantando ${numCPUs} workers para máximo rendimiento...`);

  // --- 3. INICIAR CRON JOB AQUÍ (PRODUCCIÓN) ---
  // Al ponerlo aquí, aseguramos que SOLO haya 1 reloj corriendo, 
  // sin importar cuántos workers (núcleos) tenga el servidor.
  notificationService.initDailyScheduler();

  // Crear workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} murió. Reviviendo...`);
    cluster.fork();
  });

} else {
  // BLOQUE WORKER O DESARROLLO (Aquí vive Express)
  
  const app = express();
  const PORT = process.env.PORT || 4000;

  // Middlewares de Seguridad y Optimización
  app.use(helmet()); 
  app.use(compression());

  // CORS: En desarrollo permite todo, en producción solo orígenes específicos
  if (isProduction) {
    const allowedOrigins = [
      'https://asesur-platform.onrender.com',
      'https://fernandoreyes04.github.io'
    ];
    
    app.use(cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS bloqueado: ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
  } else {
    // Desarrollo: Permitir cualquier origen
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
  }

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Demasiadas peticiones, intenta en 15 min.'
  });
  app.use('/api/', limiter);

  app.use(express.json());

  // --- RUTAS ---
  app.use('/api/auth', authRoutes);
  app.use('/api/clientes', clientRoutes);
  app.use('/api/polizas', policyRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes); // <--- 4. AGREGAMOS LA RUTA AL APP
  app.use('/api/records', recordsRoutes);   // Para el buscador global
  app.use('/api/metrics', metricsRoutes);   // Para las gráficas de dinero
  app.use('/api/config', configRoutes);     // Para la configuración del sistema

  // Health Check
  app.get('/', (req, res) => {
    res.send(`Servidor Asesur Seguro funcionando en proceso ${process.pid}`);
  });

  // Error Handler Global
  app.use((err, req, res, next) => {
    console.error('❌ Error capturado:', err.message);
    
    // Si es un error de CORS, enviar respuesta apropiada
    if (err.message.includes('CORS')) {
      return res.status(403).json({ 
        error: 'Acceso bloqueado por política CORS',
        origin: req.headers.origin 
      });
    }
    
    res.status(err.status || 500).json({ 
      error: err.message || 'Algo salió mal en el servidor seguro.' 
    });
  });

  app.listen(PORT, () => {
    console.log(`🛡️ Servidor escuchando en puerto ${PORT} (PID: ${process.pid})`);
    
    // --- 5. INICIAR CRON JOB AQUÍ (SOLO DESARROLLO) ---
    // Si NO estamos en producción, el bloque "Maestro" de arriba no se ejecuta.
    // Así que debemos iniciar el Cron aquí para que funcione mientras programas en tu laptop.
    if (!isProduction) {
        console.log('🔧 Modo Desarrollo detectado: Iniciando Cron Job local.');
        notificationService.initDailyScheduler();
    }
  });
}