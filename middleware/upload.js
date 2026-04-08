const multer = require('multer');
const path = require('path');

// Try to load sharp, but don't crash if not installed
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.log('⚠️  Sharp not installed - image compression will be skipped');
  console.log('   Install with: npm install sharp');
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

// Check file type - allow all common image formats
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|webp|gif|bmp|svg|avif|tiff|heic/i;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  // Accept file if either extension or mimetype matches, or fallback to accept all images
  if (extname || mimetype || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // Fallback: accept all image files
    cb(null, true);
  }
}

// Init upload with 50MB limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).array('images', 10); // Allow up to 10 images

// Image compression middleware using Sharp (optional)
const compressImages = async (req, res, next) => {
  // Skip if no files or sharp not available
  if (!req.files || req.files.length === 0) {
    return next();
  }

  if (!sharp) {
    console.log('⚠️  Skipping image compression (sharp not installed)');
    return next();
  }

  try {
    // Process all images in parallel for faster upload
    await Promise.all(
      req.files.map(async (file) => {
        try {
          // Skip compression for very small images (< 200KB)
          if (file.size < 200 * 1024) {
            console.log(`✓ Skipping compression for small image: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`);
            return;
          }

          const compressedPath = file.path.replace(/(\.[\w]+)$/, '-compressed$1');
          
          await sharp(file.path)
            .resize({ 
              width: 1200, 
              height: 1200, 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 80 })
            .toFile(compressedPath);

          // Replace original file with compressed version
          const fs = require('fs');
          fs.renameSync(compressedPath, file.path);
          
          console.log(`✓ Compressed: ${file.originalname}`);
        } catch (fileError) {
          // If compression fails for one file, keep original
          console.log(`⚠️  Compression failed for ${file.originalname}, keeping original`);
        }
      })
    );

    next();
  } catch (error) {
    // If compression completely fails, still allow upload
    console.log('⚠️  Image compression skipped:', error.message);
    next();
  }
};

module.exports = { upload, compressImages };