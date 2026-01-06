const express = require('express');
const router = express.Router();

// IMPORTANTE: Asegúrate de importar 'getConfig' y 'updateConfig'
// (Antes se llamaban getEmailConfig y updateEmailConfig)
const { getConfig, updateConfig } = require('../controllers/configController');

// Rutas
router.get('/email', getConfig);
router.put('/email', updateConfig);

module.exports = router;