const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getDashboardNotifications();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const updateNotificationEmail = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
        const err = new Error("El email es obligatorio");
        err.status = 400;
        throw err;
    }
    const result = await notificationService.updateEmailConfig(newEmail);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRenewals = async (req, res, next) => {
  try {
    const data = await notificationService.getRenewalsList();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, updateNotificationEmail, getRenewals };