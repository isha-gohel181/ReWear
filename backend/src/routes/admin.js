const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  isAdmin,
  getPendingItems,
  getDashboardStats,
  updateUserRole,
} = require("../controllers/adminController");

const router = express.Router();

// All routes require authentication and admin privileges
router.use(requireAuth);
router.use(isAdmin);

// Admin routes
router.get("/pending-items", getPendingItems);
router.get("/stats", getDashboardStats);
router.post("/user-role", updateUserRole);

module.exports = router;
