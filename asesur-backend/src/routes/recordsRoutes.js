const express = require('express');
const router = express.Router();
const recordsController = require('../controllers/recordsController');

// 1. SEGURIDAD: Importamos el middleware de autenticación
const authMiddleware = require('../middlewares/authMiddleware');

// --- RUTAS ---

// GET /api/records/search?q=Fernando
// Protegido: Solo usuarios logueados pueden buscar expedientes de clientes
router.get('/search', authMiddleware, recordsController.searchRecords);

module.exports = router;