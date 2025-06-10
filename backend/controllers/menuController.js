const db = require("../databasemenu");
const upload = require('../uploadMiddleware');
const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('../config/paths');

// CREATE
exports.createCategory = [
  upload.single('image'),
  (req, res) => {
    const { categorie } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    console.log('Creating category with data:', { categorie, imagePath });
    if (req.file) {
      console.log('File uploaded:', req.file.filename, 'at path:', path.join(UPLOADS_DIR, req.file.filename));
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
    const categories = results.map(category => ({
      ...category,
      image: category.image ? `uploads/${path.basename(category.image)}` : null
    }));
    console.log("Categories retrieved:", categories);
    res.status(200).json(categories);
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
      const category = {
        ...results[0],
        image: results[0].image ? `uploads/${path.basename(results[0].image)}` : null
      };
      res.status(200).json(category);
    }
  );
};

// UPDATE
exports.updateCategory = [
  upload.single('image'),
  (req, res) => {
    const { id } = req.params;
    const { categorie, image } = req.body;
    let imagePath = req.file ? `uploads/${req.file.filename}` : (image || null);

    console.log('Updating category with data:', { id, categorie, imagePath, existingImage: image });

    if (!categorie || categorie.trim() === "") {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Validate existing image if no new file is uploaded
    if (!req.file && image) {
      const normalizedImage = image.startsWith('uploads/') ? image : `uploads/${path.basename(image)}`;
      const fullPath = path.join(UPLOADS_DIR, path.basename(normalizedImage));
      if (!fs.existsSync(fullPath)) {
        console.warn('Existing image file not found:', fullPath);
        imagePath = null;
      } else {
        imagePath = normalizedImage;
      }
    }

    // Fetch current category to get old image path
    db.query(
      "SELECT image FROM menu WHERE id = ?",
      [parseInt(id)],
      (err, results) => {
        if (err) {
          console.error("Error fetching category:", err);
          return res.status(500).json({ error: "Failed to fetch category" });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: "Category not found" });
        }

        const oldImage = results[0].image;

        // Delete old image if a new one is uploaded
        if (req.file && oldImage && oldImage !== imagePath) {
          const oldImagePath = path.join(UPLOADS_DIR, path.basename(oldImage));
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
              console.log('Deleted old image:', oldImagePath);
            }
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }

        // Update category
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
            console.log('Category updated successfully:', { id, categorie, imagePath });
            res.status(200).json({ message: "Category updated successfully" });
          }
        );
      }
    );
  }
];

// DELETE
exports.deleteCategory = (req, res) => {
  const { id } = req.params;

  // Fetch current category to get image path
  db.query(
    "SELECT image FROM menu WHERE id = ?",
    [parseInt(id)],
    (err, results) => {
      if (err) {
        console.error("Error fetching category:", err);
        return res.status(500).json({ error: "Failed to fetch category" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      const image = results[0].image;

      // Delete associated items
      db.query("DELETE FROM items WHERE category_id = ?", [parseInt(id)], (err) => {
        if (err) {
          console.error("Error deleting associated items:", err);
          return res.status(500).json({ error: "Failed to delete associated items" });
        }

        // Delete the category
        db.query("DELETE FROM menu WHERE id = ?", [parseInt(id)], (err, result) => {
          if (err) {
            console.error("Error deleting category:", err);
            return res.status(500).json({ error: "Failed to delete category" });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Category not found" });
          }

          // Delete image file if it exists
          if (image) {
            const imagePath = path.join(UPLOADS_DIR, path.basename(image));
            try {
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('Deleted category image:', imagePath);
              }
            } catch (err) {
              console.error('Error deleting category image:', err);
            }
          }

          res.status(200).json({ message: "Category deleted successfully" });
        });
      }
    );
  }
);};