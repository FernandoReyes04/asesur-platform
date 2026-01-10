const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

// 1. SEGURIDAD: Importamos el middleware de autenticación
const authMiddleware = require('../middlewares/authMiddleware');

// --- RUTAS ---

// GET /api/metrics
// Protegido: Solo usuarios logueados pueden ver el dinero y rendimiento
router.get('/', authMiddleware, metricsController.getMetrics);

module.exports = router;