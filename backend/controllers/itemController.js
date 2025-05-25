const db = require("../databasemenu");
const upload = require('../uploadMiddleware');
const path = require('path');
const fs = require('fs');

// CREATE
exports.createItem = [
  (req, res, next) => {
    console.log('Pre-upload middleware:', {
      body: req.body,
      files: req.files,
      headers: req.headers
    });
    next();
  },
  upload.single('image'),
  (req, res) => {
    console.log('Post-upload middleware:', {
      body: req.body,
      file: req.file,
      headers: req.headers
    });
    
    const { name, category_id, price } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (req.file) {
      const fullPath = path.join(__dirname, '..', 'uploads', req.file.filename);
      console.log('File upload details:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        fullPath,
        exists: fs.existsSync(fullPath)
      });

      // Verify file is readable
      try {
        const stats = fs.statSync(fullPath);
        console.log('File stats:', stats);
      } catch (err) {
        console.error('Error reading uploaded file:', err);
      }
    }

    // Check if fields are missing or invalid
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "A valid item name is required" });
    }
    const parsedCategoryId = parseInt(category_id);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ error: "A valid category_id (positive integer) is required" });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "A valid price (positive number) is required" });
    }

    db.query(
      "INSERT INTO items (item_name, category_id, item_price, image) VALUES (?, ?, ?, ?)",
      [name, parsedCategoryId, parsedPrice, imagePath],
      (err, result) => {
        if (err) {
          console.error("Error creating item:", err);
          if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ error: "Invalid category_id: Category does not exist" });
          }
          return res.status(500).json({ error: "Failed to create item" });
        }
        res.status(201).json({ id: result.insertId, name, category_id: parsedCategoryId, price: parsedPrice, image: imagePath });
      }
    );
  }
];

// READ ALL (with categorie from menu table)
exports.getItems = (req, res) => {
  console.log("GET request for /api/items");

  db.query(
    `SELECT i.item_id AS id, i.item_name AS name, i.category_id, m.categorie, i.item_price AS price, i.image 
     FROM items i 
     JOIN menu m ON i.category_id = m.id`,
    (err, results) => {
      if (err) {
        console.error("Error retrieving items:", err);
        return res.status(500).json({ error: "Failed to retrieve items" });
      }
      console.log("Items retrieved:", results);
      res.status(200).json(results);
    }
  );
};

// READ ALL (basic, without categorie)
exports.getItemsBasic = (req, res) => {
  console.log("GET request for /api/items/basic");

  db.query(
    "SELECT item_id AS id, item_name AS name, category_id, item_price AS price, image FROM items",
    (err, results) => {
      if (err) {
        console.error("Error retrieving items (basic):", err);
        return res.status(500).json({ error: "Failed to retrieve items" });
      }
      console.log("Items (basic) retrieved:", results);
      res.status(200).json(results);
    }
  );
};

// READ ONE
exports.getItemById = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT i.item_id AS id, i.item_name AS name, i.category_id, m.categorie, i.item_price AS price, i.image 
     FROM items i 
     JOIN menu m ON i.category_id = m.id 
     WHERE i.item_id = ?`,
    [parseInt(id)],
    (err, results) => {
      if (err) {
        console.error("Error retrieving item:", err);
        return res.status(500).json({ error: "Failed to retrieve item" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.status(200).json(results[0]);
    }
  );
};

// UPDATE
exports.updateItem = [
  upload.single('image'),
  (req, res) => {
    const { id } = req.params;
    const { name, category_id, price, image } = req.body;
    // If a new file is uploaded, use that path. Otherwise keep the existing path if provided
    const imagePath = req.file ? `/uploads/${req.file.filename}` : (image || null);

    console.log('Updating item with data:', { id, name, category_id, price, imagePath });
    if (req.file) {
      console.log('File uploaded:', req.file.filename, 'at path:', path.join(__dirname, '..', 'uploads', req.file.filename));
    }

    // Check if fields are missing or invalid
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "A valid item name is required" });
    }
    const parsedCategoryId = parseInt(category_id);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ error: "A valid category_id (positive integer) is required" });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "A valid price (positive number) is required" });
    }

    db.query(
      "UPDATE items SET item_name = ?, category_id = ?, item_price = ?, image = ? WHERE item_id = ?",
      [name, parsedCategoryId, parsedPrice, imagePath, parseInt(id)],
      (err, result) => {
        if (err) {
          console.error("Error updating item:", err);
          if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ error: "Invalid category_id: Category does not exist" });
          }
          return res.status(500).json({ error: "Failed to update item" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Item not found" });
        }
        res.status(200).json({ message: "Item updated successfully" });
      }
    );
  }
];

// DELETE
exports.deleteItem = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM items WHERE item_id = ?", [parseInt(id)], (err, result) => {
    if (err) {
      console.error("Error deleting item:", err);
      return res.status(500).json({ error: "Failed to delete item" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(200).json({ message: "Item deleted successfully" });
  });
};