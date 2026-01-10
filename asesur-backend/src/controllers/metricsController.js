const metricsService = require('../services/metricsService');

const getMetrics = async (req, res, next) => {
  try {
    // 🔥 AQUÍ ESTABA EL ERROR:
    // Antes llamábamos a 'getFinancialMetrics' (que no existe).
    // Ahora llamamos a TU función real: 'calculateGeneralMetrics'.
    const data = await metricsService.calculateGeneralMetrics();
    
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMetrics };