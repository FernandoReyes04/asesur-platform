const clientService = require('../services/clientService');

const getClients = async (req, res, next) => {
  try {
    const { q } = req.query;
    const clients = await clientService.getAllClients(q);
    
    // Respondemos siempre con estructura consistente
    res.status(200).json(clients);
  } catch (error) {
    // Si falla, se lo pasamos al middleware de errores (errorHandler)
    next(error);
  }
};

const createClient = async (req, res, next) => {
  try {
    const newClient = await clientService.createClient(req.body);
    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    next(error);
  }
};

const searchClients = async (req, res, next) => {
  try {
    const { q } = req.query;
    const results = await clientService.getAllClients(q);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedClient = await clientService.updateClient(id, updateData);
    res.status(200).json({ success: true, data: updatedClient });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClients, createClient, searchClients, updateClient };