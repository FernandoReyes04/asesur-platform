// src/controllers/configController.js
const configService = require('../services/configService');

const getConfig = async (req, res, next) => {
  try {
    // Conectamos con TU método: getNotificationSettings
    const config = await configService.getNotificationSettings();
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    // req.body trae { email, time } (validado por Joi)
    const { email, time } = req.body;
    
    // Conectamos con TU método: updateNotificationSettings
    const result = await configService.updateNotificationSettings(email, time);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getConfig, updateConfig };