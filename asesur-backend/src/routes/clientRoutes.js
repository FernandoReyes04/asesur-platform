const express = require('express')
const router = express.Router()
const controller = require('../controllers/clientController')

router.post('/', controller.createClient)
router.get('/search', controller.searchClients)
router.put('/:id', controller.updateClient) // <--- NUEVA RUTA PUT

module.exports = router