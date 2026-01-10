// Captura cualquier error, lo loguea y responde al cliente de forma segura
const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error en ${req.method} ${req.url}:`, err.stack);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    error: message,
    // En producción no mostramos el stack para no dar pistas a hackers
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

module.exports = errorHandler;