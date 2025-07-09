const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getCurrentUser,
  updateUserProfile,
  getAllUsers,
  deleteUserAccount,
} = require("../controllers/userController");

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// User routes
router.get("/me", getCurrentUser);
router.put("/me", updateUserProfile);
router.get("/", getAllUsers);
router.delete("/me", deleteUserAccount);

module.exports = router;
