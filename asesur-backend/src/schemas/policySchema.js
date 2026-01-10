const Joi = require('joi');

const createPolicySchema = Joi.object({
  // Relación obligatoria
  cliente_id: Joi.string().required().messages({
    'any.required': 'La póliza debe estar asociada a un cliente'
  }),

  // Datos Generales
  numero_poliza: Joi.string().required(),
  aseguradora: Joi.string().required(),
  tipo_poliza: Joi.string().optional().allow(''),
  forma_pago: Joi.string().valid('Anual', 'Semestral', 'Trimestral', 'Mensual', 'Contado').optional(),
  vendedor: Joi.string().optional().allow(''),
  
  // Fechas (Deben ser fechas válidas ISO)
  poliza_inicio: Joi.date().iso().required(),
  poliza_fin: Joi.date().iso().required().greater(Joi.ref('poliza_inicio')).messages({
    'date.greater': 'La fecha fin de póliza debe ser posterior al inicio'
  }),
  
  recibo_inicio: Joi.date().iso().required(),
  recibo_fin: Joi.date().iso().required().greater(Joi.ref('recibo_inicio')).messages({
    'date.greater': 'La fecha fin de recibo debe ser posterior al inicio'
  }),

  // Dineros (Números positivos)
  prima_neta: Joi.number().min(0).optional(),
  prima_total: Joi.number().min(0).required(),
  numero_recibo: Joi.string().optional().allow(''), // "1/12", "1/1", etc.

  // Estado opcional (el servicio lo asigna si falta)
  estado: Joi.string().valid('pendiente', 'pagado', 'cancelada', 'vencido').optional()
});

// Para actualizaciones (PUT), permitimos que los campos sean opcionales
// (Por si solo quieres corregir la prima total sin mandar todo lo demás)
const updatePolicySchema = createPolicySchema.fork(
    Object.keys(createPolicySchema.describe().keys), 
    (schema) => schema.optional()
);

module.exports = { createPolicySchema, updatePolicySchema };