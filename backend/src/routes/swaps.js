const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  requestSwap,
  respondToSwap,
  getUserSwaps,
  addSwapMessage,
} = require("../controllers/swapController");

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Swap routes
router.post("/request", requestSwap);
router.post("/respond", respondToSwap);
router.get("/user", getUserSwaps);
router.post("/message", addSwapMessage);

module.exports = router;
