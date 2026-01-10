const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// 1. SEGURIDAD: Importamos el middleware de autenticación
const authMiddleware = require('../middlewares/authMiddleware');

// --- RUTAS ---

// GET /api/dashboard
// Agregamos 'authMiddleware' para asegurar que solo usuarios logueados vean los datos
router.get('/', authMiddleware, dashboardController.getDashboardData);

module.exports = router;