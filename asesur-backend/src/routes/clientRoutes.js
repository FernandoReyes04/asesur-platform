const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const validateSchema = require('../middlewares/validateSchema');
const { createClientSchema } = require('../schemas/clientSchema');

// --- RUTAS ---

// GET /api/clientes - Obtener todos (o buscar si se envía ?q=...)
router.get('/', authMiddleware, clientController.getClients);

// GET /api/clientes/search - Ruta específica de búsqueda
router.get('/search', authMiddleware, clientController.searchClients);

// POST /api/clientes - Crear nuevo cliente
router.post('/', 
    authMiddleware, 
    validateSchema(createClientSchema), 
    clientController.createClient
);

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', 
    authMiddleware, 
    clientController.updateClient
);

module.exports = router;