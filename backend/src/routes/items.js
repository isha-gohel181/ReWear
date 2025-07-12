const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  moderateItem,
} = require("../controllers/itemController");
const { isAdmin } = require("../controllers/adminController");

const router = express.Router();

// Public routes
router.get("/", getItems); // Anyone can browse items

// Auth required routes
router.post("/", requireAuth, upload.array("images", 5), createItem);
router.get("/:id", getItemById);
router.put("/:id", requireAuth, upload.array("images", 5), updateItem);
router.delete("/:id", requireAuth, deleteItem);

// Admin routes
router.post("/moderate", requireAuth, isAdmin, moderateItem);

module.exports = router;
