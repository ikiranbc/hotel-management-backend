const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bookings', bookingRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
