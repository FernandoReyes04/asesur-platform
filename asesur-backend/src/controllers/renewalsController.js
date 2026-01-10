const renewalsService = require('../services/renewalsService');

const getRenewals = async (req, res, next) => {
  try {
    // Delegamos toda la carga al servicio
    const data = await renewalsService.getRenewalsStatus();
    
    res.status(200).json(data);
  } catch (error) {
    // Si falla la BD o el procesamiento, el middleware global se encarga
    console.error("❌ Error en getRenewals:", error.message);
    next(error);
  }
};

module.exports = { getRenewals };