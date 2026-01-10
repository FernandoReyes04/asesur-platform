const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const validateSchema = require('../middlewares/validateSchema');

// Esquemas
const { updateConfigSchema } = require('../schemas/configSchema');


// --- RUTAS ---

// GET: Solo requiere estar logueado (authMiddleware)
router.get('/', authMiddleware, configController.getConfig);

// PUT: Requiere estar logueado Y enviar datos válidos (auth + schema)
router.put('/', 
    authMiddleware, 
    validateSchema(updateConfigSchema), 
    configController.updateConfig
);

module.exports = router;