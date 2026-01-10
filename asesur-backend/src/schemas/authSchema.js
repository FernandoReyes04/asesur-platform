const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Ingresa un correo válido',
    'any.required': 'El correo es obligatorio'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres'
  })
});

const registerSchema = Joi.object({
  nombre: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('Admin', 'Empleado', 'admin', 'empleado').optional()
});

module.exports = { loginSchema, registerSchema };