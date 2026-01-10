const dashboardService = require('../services/dashboardService');

const getDashboardData = async (req, res, next) => {
  try {
    // El servicio se encarga de la magia y de los errores de DB
    const data = await dashboardService.getSummaryData();
    
    res.status(200).json(data);
  } catch (error) {
    // Si algo falla en el servicio, lo pasamos al middleware global
    next(error);
  }
};

module.exports = { getDashboardData };