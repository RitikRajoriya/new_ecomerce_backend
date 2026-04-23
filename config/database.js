const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }
    
    // Warn if using localhost in production
    if (process.env.NODE_ENV === 'production' && (uri.includes('localhost') || uri.includes('127.0.0.1'))) {
      console.warn('⚠️  WARNING: Using localhost MongoDB in production environment');
      console.warn('Consider using MongoDB Atlas for production deployment');
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Please check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;
