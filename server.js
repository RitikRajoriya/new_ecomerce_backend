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

// Load environment variables
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
// Log incoming requests to the console
app.use((req, res, next) => {
  console.log(`REQUEST: ${req.method} ${req.url} | Headers: ${JSON.stringify(req.headers)} | Body: ${JSON.stringify(req.body)}`);
  next();
});
app.use(logger); // Log all requests and responses
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use('/uploads', express.static('uploads'));

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

// 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//   });
// });

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
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
