const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
        const error = new Error("Email y contraseña obligatorios");
        error.status = 400;
        throw error;
    }

    const result = await authService.loginUser(email, password);
    res.status(200).json(result);

  } catch (error) {
    next(error); // Se va al middleware global de errores
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, nombre, rol } = req.body;

    // Validación básica
    if (!email || !password || !nombre) {
        const error = new Error("Faltan datos (email, password, nombre)");
        error.status = 400;
        throw error;
    }

    const result = await authService.registerUser(email, password, nombre, rol);
    res.status(201).json(result);

  } catch (error) {
    next(error);
  }
};

module.exports = { login, register };