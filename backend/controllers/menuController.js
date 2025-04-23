const db = require("../databasemenu");

// CREATE
exports.createCategory = (req, res) => {
  const { categorie } = req.body;

  if (!categorie || categorie.trim() === "") {
    return res.status(400).json({ error: "Category name is required" });
  }

  db.query("INSERT INTO menu (categorie) VALUES (?)", [categorie], (err, result) => {
    if (err) {
      console.error("Error creating category:", err);
      return res.status(500).json({ error: "Failed to create category" });
    }
    res.status(201).json({ id: result.insertId, categorie });
  });
};

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

// UPDATE
exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { categorie } = req.body;

  if (!categorie || categorie.trim() === "") {
    return res.status(400).json({ error: "Category name is required" });
  }

  db.query("UPDATE menu SET categorie = ? WHERE id = ?", [categorie, parseInt(id)], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res.status(500).json({ error: "Failed to update category" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({ message: "Category updated successfully" });
  });
};

// DELETE
exports.deleteCategory = (req, res) => {
  const { id } = req.params;

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
};