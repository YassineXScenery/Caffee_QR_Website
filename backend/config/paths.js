const path = require('path');

// Define all important paths here
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Function to validate uploads directory
const validateUploadsDir = () => {
    const fs = require('fs');
    if (!fs.existsSync(UPLOADS_DIR)) {
        try {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            console.log('Created uploads directory at:', UPLOADS_DIR);
        } catch (err) {
            console.error('Error creating uploads directory:', err);
            throw err;
        }
    }
    return UPLOADS_DIR;
};

module.exports = {
    UPLOADS_DIR,
    validateUploadsDir
};
