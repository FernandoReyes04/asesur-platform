// src/controllers/recordsController.js
// 1. Importamos el servicio correcto (Records, no Renewals)
const recordsService = require('../services/recordsService');

const searchRecords = async (req, res, next) => {
  try {
    // Obtenemos el término de búsqueda de la URL (ej: ?q=Fernando)
    const { q } = req.query; 

    // Llamamos a la función "searchGlobalRecords" que definiste en tu servicio
    const results = await recordsService.searchGlobalRecords(q);
    
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// 2. Exportamos la función con el nombre que espera la ruta
module.exports = { searchRecords };