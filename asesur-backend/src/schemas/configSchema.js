const Joi = require('joi');

const updateConfigSchema = Joi.object({
  // Validamos que sea un email real
  email: Joi.string().email().required().messages({
    'string.email': 'El correo de notificaciones debe ser válido',
    'any.required': 'El correo es obligatorio'
  }),

  // Validamos formato de hora 24h (HH:MM) usando Regex
  // Ejemplos válidos: "09:00", "14:30", "23:59"
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'La hora debe tener formato HH:MM (ej. 09:00)'
  })
});

module.exports = { updateConfigSchema };