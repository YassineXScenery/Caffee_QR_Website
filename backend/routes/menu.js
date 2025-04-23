const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

router.post("/", menuController.createCategory);
router.get("/", menuController.getCategories);
router.put("/:id", menuController.updateCategory);
router.delete("/:id", menuController.deleteCategory);

module.exports = router;