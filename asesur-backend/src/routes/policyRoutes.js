const express = require('express')
const router = express.Router()

// 1. Importamos el controlador de pólizas (CRUD normal y Cobranza)
const policyController = require('../controllers/policyController')

// 2. Importamos el NUEVO controlador exclusivo para Renovaciones
const renewalsController = require('../controllers/renewalsController')


// --- RUTA RENOVACIONES ---
// IMPORTANTE: Esta ruta debe ir PRIMERO para que Express no confunda "renovaciones" con un ID de cliente o póliza.
// Usamos el nuevo renewalsController:
router.get('/renovaciones', renewalsController.getRenewals)


// --- RUTAS DE PÓLIZAS (CRUD) ---
// Usamos el policyController normal:

router.get('/', policyController.getPolicies)
router.get('/cliente/:cliente_id', policyController.getPoliciesByClient)
router.post('/', policyController.createPolicy)
router.put('/:id', policyController.updatePolicy)
router.put('/:id/pagar', policyController.markAsPaid)
router.put('/:id/cancelar', policyController.cancelPolicy)

module.exports = router