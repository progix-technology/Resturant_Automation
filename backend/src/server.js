import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { paymentController } from './controllers/paymentController.js';
import { whatsappService } from './services/whatsappService.js';
import { connectMongoDB, lastDbError } from './config/db.js';
import mongoose from 'mongoose';
import { apiLimiter } from './middleware/rateLimiter.js';
import { getTokenValidity } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable 'trust proxy' for Render / Vercel / Cloudflare reverse proxies (fixes rate limiter ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
app.set('trust proxy', 1);

// Strict Production & Vercel CORS Configuration
const getAllowedOrigins = () => {
  const envOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaultAllowedOrigins = [
    'https://resturant-automation-progix.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
  ];

  return Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));
};

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests without Origin (e.g. Razorpay webhooks, server health probes, cURL)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.trim().replace(/\/$/, '');

      // Allow official Vercel domain, any Vercel preview domain, and local dev
      if (
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('resturant-automation-progix') ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS REJECTED] Access denied for unauthorized origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24-hour preflight cache
  })
);

// Parse JSON request body & preserve raw body buffer for Razorpay/Stripe webhook cryptographic verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// API Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check (not rate-limited)
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Restaurant Order Booking & SaaS Multi-Tenant Backend',
    database: dbConnected ? 'MongoDB Atlas Connected' : `Connecting / Standalone (Error: ${lastDbError || 'None'})`,
    dbState: mongoose.connection.readyState,
    rateLimiting: 'Enabled (Auth & General API)',
    tokenValidity: getTokenValidity(),
    version: '1.0.0',
  });
});

// Apply General Rate Limiter to all /api routes
app.use('/api', apiLimiter);

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/payment', paymentRoutes);

// Razorpay Direct Webhook Safety Net (Handles root POST or /webhook in case user points Razorpay to domain root)
app.post('/', paymentController.handleWebhook);
app.post('/webhook', paymentController.handleWebhook);


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Connect to MongoDB Atlas & Initialize Server
connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 RESTAURANT & SAAS BACKEND LISTENING ON PORT ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`⏱️ JWT Token Validity: ${getTokenValidity()}`);
    console.log(`🛡️ Rate Limiting: Active (Auth: 15 req/15m, API: 10,000 req/15m)`);
    console.log(`🍃 Database: MongoDB Atlas Connected & Protected`);
    console.log('====================================================');

    // Initialize Baileys WhatsApp Background Service
    whatsappService.init();
  });
});
