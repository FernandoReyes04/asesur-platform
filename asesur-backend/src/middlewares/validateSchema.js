const validateSchema = (schema) => {
  return (req, res, next) => {
    // Validamos el body contra el esquema
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      // Si hay errores, sacamos los mensajes limpios
      const errorMessages = error.details.map((detail) => detail.message);
      
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errorMessages
      });
    }

    // Si todo está bien, pase usted
    next();
  };
};

module.exports = validateSchema;