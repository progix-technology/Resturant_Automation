import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import { whatsappService } from './services/whatsappService.js';
import { connectMongoDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { getTokenValidity } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable 'trust proxy' for Render / Vercel / Cloudflare reverse proxies (fixes rate limiter ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
app.set('trust proxy', 1);

// Enable CORS for all frontend origins
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// API Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check (not rate-limited)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Restaurant Order Booking & SaaS Multi-Tenant Backend',
    database: 'MongoDB Atlas Connected',
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
