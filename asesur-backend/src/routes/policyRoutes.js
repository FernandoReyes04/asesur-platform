const express = require('express')
const router = express.Router()
const { 
    getPolicies, 
    getPoliciesByClient, 
    createPolicy, 
    updatePolicy, 
    markAsPaid 
} = require('../controllers/policyController')

// 1. Obtener TODAS las pólizas (Para el Dashboard de Cobranza)
// Esta ruta dispara la actualización automática de estados "vencido/pendiente"
router.get('/', getPolicies)

// 2. Obtener pólizas de un cliente específico (Para RecordsView o historial)
router.get('/cliente/:cliente_id', getPoliciesByClient)

// 3. Registrar nueva póliza
router.post('/', createPolicy)

// 4. Editar datos de una póliza existente
router.put('/:id', updatePolicy)

// 5. Marcar una póliza como PAGADA (Botón verde)
router.put('/:id/pagar', markAsPaid)

module.exports = router