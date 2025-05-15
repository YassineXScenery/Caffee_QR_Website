const db = require('../databasemenu');

const createTableIfNotExists = () => {
  return new Promise((resolve, reject) => {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS footer_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(50) NOT NULL,
        label VARCHAR(100) NOT NULL,
        value TEXT NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    db.query(createQuery, (err) => {
      if (err) {
        console.error('Error creating footer_settings table:', err);
        return reject(err);
      }
      console.log('Footer settings table exists or was created successfully');
      resolve();
    });
  });
};

// Initialize table if it doesn't exist
createTableIfNotExists().catch(console.error);

// Get all footer settings
exports.getFooterSettings = (req, res) => {
  db.query('SELECT * FROM footer_settings', (err, results) => {
    if (err) {
      console.error('Error fetching footer settings:', err);
      return res.status(500).json({ error: 'Failed to fetch footer settings' });
    }
    
    console.log('Raw footer settings from DB:', results);
      // Transform results into a more usable format
    const settings = {
      social: [],
      contact: {
        phone: [],
        email: []
      },
      location: {
        address: []
      }
    };
    
    results.forEach(setting => {
      if (setting.type === 'social') {
        settings.social.push({
          label: setting.label,
          value: setting.value,
          display_name: setting.display_name || ''
        });
      } else if (setting.type === 'contact') {
        if (setting.label === 'phone') {
          settings.contact.phone.push(setting.value);
        } else if (setting.label === 'email') {
          settings.contact.email.push(setting.value);
        }
      } else if (setting.type === 'location') {
        if (setting.label === 'address') {
          settings.location.address.push(setting.value);
        }
      }
    });
    
    res.json(settings);
  });
};

// Update footer settings
exports.updateFooterSettings = (req, res) => {
  const { settings } = req.body;
  
  console.log('Received settings to update:', settings);
  
  // First, clear existing settings
  db.query('DELETE FROM footer_settings', (err) => {
    if (err) {
      console.error('Error clearing footer settings:', err);
      return res.status(500).json({ error: 'Failed to update footer settings' });
    }

    // Prepare new settings
    const values = [];
      // Add social media links
    if (settings.social) {
      settings.social.forEach(social => {
        if (social.label && social.value) {
          // Make sure to save display_name even if it's empty string
          values.push(['social', social.label, social.value, social.display_name || social.label]);
        }
      });
    }
    
    // Add contact information
    if (settings.contact) {
      Object.entries(settings.contact).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(val => {
            if (val) values.push(['contact', key, val, null]);
          });
        } else if (value) {
          values.push(['contact', key, value, null]);
        }
      });
    }
    
    // Add location information
    if (settings.location) {
      Object.entries(settings.location).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(val => {
            if (val) values.push(['location', key, val, null]);
          });
        } else if (value) {
          values.push(['location', key, value, null]);
        }
      });
    }
    
    if (values.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    // Debugging logs
    console.log('Prepared values for insert:', JSON.stringify(values, null, 2));
    const query = 'INSERT INTO footer_settings (type, label, value, display_name) VALUES ?';
    console.log('Insert query:', query);

    db.query(query, [values], (err) => {
      if (err) {
        console.error('Error inserting footer settings:', err);
        return res.status(500).json({ error: 'Failed to update footer settings' });
      }
      res.json({ message: 'Footer settings updated successfully' });
    });
  });
};
