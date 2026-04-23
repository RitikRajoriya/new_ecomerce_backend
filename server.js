const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const videoRoutes = require('./routes/videoRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Logger middleware
const logger = require('./middleware/logger');

// Load environment variables - MUST be at the top
dotenv.config();

// Initialize Express app
const app = express();

// Handle preflight OPTIONS requests FIRST (before CORS)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    console.log(`OPTIONS request received from: ${origin}`);
    
    // Allow specific origins or indianhandicraftshop.com domain
    if (allowedOrigins.includes(origin) || (origin && origin.includes('indianhandicraftshop.com'))) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`✓ CORS allowed for: ${origin}`);
    } else if (!origin) {
      // Allow requests with no origin
      res.header('Access-Control-Allow-Origin', '*');
      console.log(`✓ CORS allowed (no origin)`);
    } else {
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`⚠ CORS fallback for: ${origin}`);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '600');
    console.log('✓ OPTIONS preflight responded with 200');
    return res.sendStatus(200);
  }
  next();
});

// Enable CORS for multiple frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://indianhandicraftshop.com',
  'https://www.indianhandicraftshop.com',
  'https://admin.indianhandicraftshop.com',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, allow all origins from indianhandicraftshop.com domain
      if (origin.includes('indianhandicraftshop.com')) {
        console.log(`✓ CORS allowed for domain: ${origin}`);
        return callback(null, true);
      }
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight request for 10 minutes
}));

// Middleware
// Log incoming requests to the console (ONLY in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`REQUEST: ${req.method} ${req.url}`);
    next();
  });
} else {
  // In production, only log errors
  app.use((req, res, next) => {
    // Skip logging for successful requests to improve performance
    const originalSend = res.send;
    res.send = function(body) {
      if (res.statusCode >= 400) {
        console.log(`ERROR: ${req.method} ${req.url} - Status: ${res.statusCode}`);
      }
      return originalSend.call(this, body);
    };
    next();
  });
}
app.use(logger); // Log all requests and responses
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint (for monitoring)
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/order-help', require('./routes/orderHelpRoutes'));
app.use('/api/newsletters', newsletterRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', videoRoutes);
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/admin', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server2 is running',
  });
});

// 404 handler - MUST be after all routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Verify environment variables before starting
    console.log('\n=== Environment Verification ===');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`PORT: ${PORT}`);
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'Configured' : 'MISSING'}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'MISSING'}`);
    console.log(`CASHFREE_ENV: ${process.env.CASHFREE_ENV || 'sandbox'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);
    console.log('=============================\n');
    
    // Connect to database first
    await connectDB();
    
    // Start listening only after DB connection
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`========================================`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Cashfree ENV: ${process.env.CASHFREE_ENV || 'sandbox'}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
      console.log(`API URL: ${process.env.API_BASE_URL || 'not set'}`);
      
      // Verify Cashfree configuration
      if (process.env.CASHFREE_ENV === 'production') {
        console.log(`\n✅ PRODUCTION MODE ACTIVE`);
        console.log(`Cashfree App ID: ${process.env.CASHFREE_PROD_APP_ID ? 'Configured' : 'MISSING'}`);
        console.log(`Cashfree Secret: ${process.env.CASHFREE_PROD_SECRET_KEY ? 'Configured' : 'MISSING'}`);
        console.log(`Payment Endpoint: https://api.cashfree.com/pg/orders`);
        
        if (!process.env.CASHFREE_PROD_APP_ID || !process.env.CASHFREE_PROD_SECRET_KEY) {
          console.error('\n❌ ERROR: Production Cashfree credentials missing!');
          console.error('Please set CASHFREE_PROD_APP_ID and CASHFREE_PROD_SECRET_KEY in .env');
        }
      } else {
        console.log(`\n🔧 SANDBOX MODE ACTIVE`);
        console.log(`Cashfree App ID: ${process.env.CASHFREE_SANDBOX_APP_ID ? 'Configured' : 'MISSING'}`);
        console.log(`Payment Endpoint: https://sandbox.cashfree.com/pg/orders`);
      }
      
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    console.error('Server exited due to startup errors');
    process.exit(1);
  }
};

startServer();
