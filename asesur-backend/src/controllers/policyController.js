const policyService = require('../services/policyService');

const getPolicies = async (req, res, next) => {
  try {
    const data = await policyService.getAllPolicies();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getPoliciesByClient = async (req, res, next) => {
  try {
    const { cliente_id } = req.params;
    if (!cliente_id) {
        const err = new Error("ID de cliente requerido");
        err.status = 400;
        throw err;
    }
    const data = await policyService.getPoliciesByClientId(cliente_id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const createPolicy = async (req, res, next) => {
  try {
    const { cliente_id, numero_poliza } = req.body;

    // Validación básica de campos obligatorios
    if (!cliente_id || !numero_poliza) {
        const err = new Error("Faltan datos obligatorios (cliente_id, numero_poliza)");
        err.status = 400;
        throw err;
    }

    const newPolicy = await policyService.createPolicy(req.body);
    res.status(201).json({ message: 'Creado', data: newPolicy });

  } catch (error) {
    next(error);
  }
};

const updatePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPolicy = await policyService.updatePolicy(id, req.body);
    res.status(200).json({ message: 'Actualizado', data: updatedPolicy });
  } catch (error) {
    next(error);
  }
};

// Acciones rápidas (Pagado / Cancelar)
const markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.changeStatus(id, 'pagado');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const cancelPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.changeStatus(id, 'cancelada');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deletePolicy = async (req, res, next) => {
    try {
        const { id } = req.params;
        await policyService.deletePolicy(id);
        res.status(200).json({ 
            success: true, 
            message: "Póliza eliminada exitosamente" 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getPolicies, 
    getPoliciesByClient, 
    createPolicy, 
    updatePolicy, 
    markAsPaid, 
    cancelPolicy,
    deletePolicy
};