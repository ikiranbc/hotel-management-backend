require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const auth = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

// Downstream service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || 'http://localhost:3002';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3004';

// Public endpoints proxy routes (No JWT required)
app.use(
  '/api/users/register',
  createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true })
);
app.use(
  '/api/users/login',
  createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true })
);
app.use(
  '/api/users/admin/login-bypass',
  createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true })
);
app.use(
  '/api/users',
  auth,
  createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true })
);
app.use(
  '/api/hotels',
  auth,
  createProxyMiddleware({ target: HOTEL_SERVICE_URL, changeOrigin: true })
);
app.use(
  '/api/bookings',
  auth,
  createProxyMiddleware({ target: BOOKING_SERVICE_URL, changeOrigin: true })
);
app.use(
  '/api/wallet',
  auth,
  createProxyMiddleware({ target: WALLET_SERVICE_URL, changeOrigin: true })
);

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
