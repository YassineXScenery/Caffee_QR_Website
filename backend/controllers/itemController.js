const db = require("../databasemenu");

// CREATE
exports.createItem = (req, res) => {
  const { name, category_id, price } = req.body;

  // Check if fields are missing or invalid
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "A valid item name is required" });
  }
  if (!Number.isInteger(category_id) || category_id <= 0) {
    return res.status(400).json({ error: "A valid category_id (positive integer) is required" });
  }
  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ error: "A valid price (positive number) is required" });
  }

  db.query(
    "INSERT INTO items (item_name, category_id, item_price) VALUES (?, ?, ?)",
    [name, category_id, price],
    (err, result) => {
      if (err) {
        console.error("Error creating item:", err);
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({ error: "Invalid category_id: Category does not exist" });
        }
        return res.status(500).json({ error: "Failed to create item" });
      }
      res.status(201).json({ id: result.insertId, name, category_id, price });
    }
  );
};

// READ ALL (with categorie from menu table)
exports.getItems = (req, res) => {
  console.log("GET request for /api/items");

  db.query(
    `SELECT i.item_id AS id, i.item_name AS name, i.category_id, m.categorie, i.item_price AS price 
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
    "SELECT item_id AS id, item_name AS name, category_id, item_price AS price FROM items",
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
    `SELECT i.item_id AS id, i.item_name AS name, i.category_id, m.categorie, i.item_price AS price 
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
exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { name, category_id, price } = req.body;

  // Check if fields are missing or invalid
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "A valid item name is required" });
  }
  if (!Number.isInteger(category_id) || category_id <= 0) {
    return res.status(400).json({ error: "A valid category_id (positive integer) is required" });
  }
  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ error: "A valid price (positive number) is required" });
  }

  db.query(
    "UPDATE items SET item_name = ?, category_id = ?, item_price = ? WHERE item_id = ?",
    [name, category_id, price, parseInt(id)],
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
};

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