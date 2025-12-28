const express = require('express')
const router = express.Router()
const { getNotificationData, updateNotificationEmail } = require('../controllers/notificationController')

router.get('/', getNotificationData)
router.post('/update', updateNotificationEmail) // POST para enviar contraseña

module.exports = router