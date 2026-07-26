const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const userRoutes = require('./routes/userRoutes');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

const app = express();

// Standard middlewares for security, cross-origin access, and body parser
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serving API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount main routes
app.use('/api/users', userRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
