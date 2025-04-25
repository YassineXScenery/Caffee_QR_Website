const db = require("../databasemenu");
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads'); // Go up one directory to backend/uploads
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// CREATE
exports.createCategory = [
  upload.single('image'),
  (req, res) => {
    const { categorie } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Creating category with data:', { categorie, imagePath });
    if (req.file) {
      console.log('File uploaded:', req.file.filename, 'at path:', path.join(__dirname, '..', 'uploads', req.file.filename));
    }

    if (!categorie || categorie.trim() === "") {
      return res.status(400).json({ error: "Category name is required" });
    }

    db.query(
      "INSERT INTO menu (categorie, image) VALUES (?, ?)",
      [categorie, imagePath],
      (err, result) => {
        if (err) {
          console.error("Error creating category:", err);
          return res.status(500).json({ error: "Failed to create category" });
        }
        res.status(201).json({ id: result.insertId, categorie, image: imagePath });
      }
    );
  }
];

// READ ALL
exports.getCategories = (req, res) => {
  console.log("GET request for /api/menu");

  db.query("SELECT * FROM menu", (err, results) => {
    if (err) {
      console.error("Error retrieving categories:", err);
      return res.status(500).json({ error: "Failed to retrieve categories" });
    }
    console.log("Categories retrieved:", results);
    res.status(200).json(results);
  });
};

// READ ONE
exports.getCategoryById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT id, categorie, image FROM menu WHERE id = ?",
    [parseInt(id)],
    (err, results) => {
      if (err) {
        console.error("Error retrieving category:", err);
        return res.status(500).json({ error: "Failed to retrieve category" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(200).json(results[0]);
    }
  );
};

// UPDATE
exports.updateCategory = [
  upload.single('image'),
  (req, res) => {
    const { id } = req.params;
    const { categorie } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    console.log('Updating category with data:', { id, categorie, imagePath });
    if (req.file) {
      console.log('File uploaded:', req.file.filename, 'at path:', path.join(__dirname, '..', 'uploads', req.file.filename));
    }

    if (!categorie || categorie.trim() === "") {
      return res.status(400).json({ error: "Category name is required" });
    }

    db.query(
      "UPDATE menu SET categorie = ?, image = ? WHERE id = ?",
      [categorie, imagePath, parseInt(id)],
      (err, result) => {
        if (err) {
          console.error("Error updating category:", err);
          return res.status(500).json({ error: "Failed to update category" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        res.status(200).json({ message: "Category updated successfully" });
      }
    );
  }
];

// DELETE
exports.deleteCategory = (req, res) => {
  const { id } = req.params;

  // First, delete associated items
  db.query("DELETE FROM items WHERE category_id = ?", [parseInt(id)], (err) => {
    if (err) {
      console.error("Error deleting associated items:", err);
      return res.status(500).json({ error: "Failed to delete associated items" });
    }
    // Then delete the category
    db.query("DELETE FROM menu WHERE id = ?", [parseInt(id)], (err, result) => {
      if (err) {
        console.error("Error deleting category:", err);
        return res.status(500).json({ error: "Failed to delete category" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(200).json({ message: "Category deleted successfully" });
    });
  });
};