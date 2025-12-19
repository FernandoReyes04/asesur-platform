const express = require('express')
const router = express.Router()
const controller = require('../controllers/policyController')

router.post('/', controller.createPolicy)
router.get('/cliente/:cliente_id', controller.getPoliciesByClient)
router.put('/:id', controller.updatePolicy) // <--- NUEVA RUTA PUT

module.exports = router