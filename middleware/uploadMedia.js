const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Check file type for media (images and videos)
function checkFileType(file, cb) {
  // Allowed ext for images and videos
  const filetypes = /jpeg|jpg|png|gif|mp4|avi|mov|wmv|flv|webm/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images and Videos Only!');
  }
}

// Init upload for media
const uploadMedia = multer({
  storage: storage,
  limits: { fileSize: 50000000 }, // 50MB limit for videos
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).array('media', 20); // Allow up to 20 media files

module.exports = uploadMedia;