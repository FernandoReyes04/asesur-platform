const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. IMPORTAR EL PORTERO (Middleware)
const validateSchema = require('../middlewares/validateSchema');

// 2. IMPORTAR LAS REGLAS (Schemas)
const { loginSchema, registerSchema } = require('../schemas/authSchema');


// --- RUTAS PROTEGIDAS ---

// POST /api/auth/login
// Valida que vengan email y password antes de intentar ir a Supabase
router.post('/login', validateSchema(loginSchema), authController.login);

// POST /api/auth/register
// Valida nombre, email, password y rol antes de crear el usuario
router.post('/register', validateSchema(registerSchema), authController.register);

module.exports = router;