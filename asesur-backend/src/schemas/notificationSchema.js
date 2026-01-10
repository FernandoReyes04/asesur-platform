const Joi = require('joi');

const updateEmailSchema = Joi.object({
  newEmail: Joi.string().email().required().messages({
    'string.email': 'Debes ingresar un correo electrónico válido',
    'any.required': 'El nuevo correo es obligatorio'
  })
});

module.exports = { updateEmailSchema };