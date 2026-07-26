const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hotelRoutes = require('./routes/hotelRoutes');
const seed = require('./db/seed');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/hotels', hotelRoutes);

// Database seeding on startup
seed().catch((err) => console.error('Failed to seed database:', err));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
