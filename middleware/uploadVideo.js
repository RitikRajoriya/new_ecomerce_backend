const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Check file type for videos only
function checkFileType(file, cb) {
  // Allowed extensions for videos
  const filetypes = /mp4|avi|mov|wmv|flv|webm|mkv|3gp|m3u8/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check MIME type
  const mimetype = /video\//;
  const mimetypeTest = mimetype.test(file.mimetype);

  if ((mimetypeTest && extname) || mimetypeTest) {
    return cb(null, true);
  } else {
    cb('Error: Video files only! (mp4, avi, mov, wmv, flv, webm, mkv, 3gp)');
  }
}

// Multer upload instance for videos (ALLOW ANY SIZE UP TO 500MB)
const uploadVideo = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single('video'); // field name is 'video'

module.exports = uploadVideo;
