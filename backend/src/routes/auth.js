//backend/src/routes/auth.js
const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Protected route example
router.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "Authenticated user",
    userId: req.auth.userId,
    sessionId: req.auth.sessionId,
  });
});

// Check authentication status
router.get("/status", requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    userId: req.auth.userId,
  });
});

module.exports = router;
