const Joi = require('joi');

const createClientSchema = Joi.object({
  nombre: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 2 letras'
  }),
  
  apellido: Joi.string().min(2).max(50).required(),
  
  // Email válido o vacío (si es opcional)
  email: Joi.string().email().allow('').optional(),
  
  // Teléfono: Solo números, exactamente 10 dígitos
  telefono: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'El teléfono debe ser de 10 dígitos numéricos'
  }),

  // RFC: Patrón oficial mexicano (opcional pero si viene, debe ser válido)
  rfc: Joi.string().pattern(/^[A-ZÑ&]{3,4}\d{6}(?:[A-Z\d]{3})?$/).allow('').messages({
    'string.pattern.base': 'El formato del RFC no es válido'
  }),

  tipo_persona: Joi.string().valid('Física', 'Moral').default('Física'),
  
  // Dirección (opcionales)
  direccion: Joi.string().allow(''),
  colonia: Joi.string().allow(''),
  municipio: Joi.string().allow(''),
  estado_direccion: Joi.string().allow('')
});

module.exports = { createClientSchema };