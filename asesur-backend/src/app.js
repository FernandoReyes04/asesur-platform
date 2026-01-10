const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const clientRoutes = require('./routes/clientRoutes');

const app = express();

// Middlewares Globales
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/clientes', clientRoutes);

// Middleware de Error (SIEMPRE VA AL FINAL)
app.use(errorHandler);

module.exports = app;