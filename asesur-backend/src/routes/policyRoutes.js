const express = require('express');
const router = express.Router();

// 1. CONTROLADORES
const policyController = require('../controllers/policyController');
const renewalsController = require('../controllers/renewalsController');

// 2. MIDDLEWARES DE SEGURIDAD
const authMiddleware = require('../middlewares/authMiddleware');
const validateSchema = require('../middlewares/validateSchema');

// 3. ESQUEMAS
const { createPolicySchema, updatePolicySchema } = require('../schemas/policySchema');


// --- RUTA RENOVACIONES (Prioridad Alta) ---
// Protegido: Solo personal autorizado ve renovaciones
router.get('/renovaciones', authMiddleware, renewalsController.getRenewals);


// --- RUTAS DE PÓLIZAS (CRUD) ---

// GET: Ver todas (Protegido)
router.get('/', authMiddleware, policyController.getPolicies);

// GET: Ver por cliente (Protegido)
router.get('/cliente/:cliente_id', authMiddleware, policyController.getPoliciesByClient);

// POST: Crear (Protegido + Validación Estricta)
router.post('/', 
    authMiddleware, 
    validateSchema(createPolicySchema), 
    policyController.createPolicy
);

// PUT: Actualizar datos (Protegido + Validación Flexible)
router.put('/:id', 
    authMiddleware, 
    validateSchema(updatePolicySchema), 
    policyController.updatePolicy
);

// 🔥 DELETE: Eliminar póliza (NUEVO) 🔥
router.delete('/:id', authMiddleware, policyController.deletePolicy);


// --- ACCIONES RÁPIDAS ---
// Solo requieren Auth (no enviamos body complejo)
router.put('/:id/pagar', authMiddleware, policyController.markAsPaid);
router.put('/:id/cancelar', authMiddleware, policyController.cancelPolicy);

module.exports = router;