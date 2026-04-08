const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Try to load sharp for image compression
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.log('⚠️  Sharp not available for banner compression');
}

// Ensure uploads folder exists
const uploadPath = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// Multer upload instance (ALLOW ALL IMAGE TYPES, 20MB LIMIT)
const uploadSingle = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for banners
  fileFilter: function (req, file, cb) {
    // Allow common image types
    const allowedTypes = /jpeg|jpg|png|webp/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'), false);
    }
  }
}).single('image'); // field name

// Image compression middleware for banners
const compressBanner = async (req, res, next) => {
  // Skip if no file or sharp not available
  if (!req.file || !sharp) {
    return next();
  }

  try {
    // Skip compression for small images (< 500KB)
    if (req.file.size < 500 * 1024) {
      console.log(`✓ Skipping compression for small banner: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);
      return next();
    }

    const compressedPath = req.file.path.replace(/(\.[\w]+)$/, '-compressed$1');
    
    console.log(`🗜️  Compressing banner: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Compress and resize banner
    await sharp(req.file.path)
      .resize({ 
        width: 1920, // Max width for banners
        height: 1920, // Max height (maintains aspect ratio)
        fit: 'inside',
        withoutEnlargement: true // Don't upscale small images
      })
      .jpeg({ 
        quality: 85, // High quality but smaller size
        progressive: true // Progressive loading for web
      })
      .toFile(compressedPath);

    // Replace original file with compressed version
    fs.renameSync(compressedPath, req.file.path);
    
    // Get new file size
    const stats = fs.statSync(req.file.path);
    const originalSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
    const newSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const savings = ((1 - stats.size / req.file.size) * 100).toFixed(1);
    
    console.log(`✓ Banner compressed: ${originalSizeMB}MB → ${newSizeMB}MB (${savings}% reduction)`);
    
    // Update file size in req object
    req.file.size = stats.size;
    
    next();
  } catch (error) {
    // If compression fails, keep original file
    console.log(`⚠️  Banner compression failed: ${error.message}, keeping original`);
    next();
  }
};

module.exports = { uploadSingle, compressBanner };
