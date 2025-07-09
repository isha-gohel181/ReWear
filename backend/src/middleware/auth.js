const { requireAuth } = require("@clerk/express");

// Middleware to get user info (optional use)
const getUser = (req, res, next) => {
  try {
    // If authenticated, req.auth contains user data
    next();
  } catch (error) {
    console.error("Error getting user:", error);
    next();
  }
};

module.exports = {
  requireAuth,
  getUser,
};
