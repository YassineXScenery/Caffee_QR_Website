// Simple multer setup for image uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('./config/paths');

// Log the absolute path for debugging
console.log('Upload middleware using directory:', path.resolve(UPLOADS_DIR));
console.log('Setting up upload directory at:', UPLOADS_DIR);

// Create directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Created uploads directory');
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists and is writable
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      fs.accessSync(UPLOADS_DIR, fs.constants.W_OK);
        console.log('Upload destination:', {
        dir: UPLOADS_DIR,
        absolutePath: path.resolve(UPLOADS_DIR),
        exists: true,
        writable: true,
        file: {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype
        }
      });
      
      cb(null, UPLOADS_DIR);
    } catch (err) {
      console.error('Upload directory error:', err);
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = 'image-' + uniqueSuffix + ext;
      
      console.log('Generated filename:', {
        originalname: file.originalname,
        extension: ext,
        newFilename: filename
      });
      
      console.log('Saving file to uploads directory:', {
        filename,
        destination: UPLOADS_DIR
      });
      
      cb(null, filename);
    } catch (err) {
      console.error('Filename generation error:', err);
      cb(err);
    }
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
      headers: file.headers
    });
    
    // List of allowed image mime types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log('File type accepted');
      cb(null, true);
    } else {
      console.log('File type rejected');
      cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed!`), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
