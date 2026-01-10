const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// 1. IMPORTAR SEGURIDAD
const authMiddleware = require('../middlewares/authMiddleware');
const validateSchema = require('../middlewares/validateSchema');

// 2. IMPORTAR ESQUEMA
const { updateEmailSchema } = require('../schemas/notificationSchema');


// --- RUTAS ---

// GET /api/notifications/dashboard
// Protegido: Solo usuarios logueados ven las alertas
router.get('/dashboard', authMiddleware, notificationController.getNotifications);

// PUT /api/notifications/config
// Protegido + Validación de formato de email
router.put('/config', 
    authMiddleware, 
    validateSchema(updateEmailSchema), 
    notificationController.updateNotificationEmail
);

// GET /api/notifications/renewals
// Protegido: Datos sensibles de pólizas por vencer
router.get('/renewals', authMiddleware, notificationController.getRenewals);

module.exports = router;