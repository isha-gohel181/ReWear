const User = require("../models/User");

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.clerkId;
    delete updateData.email;
    delete updateData.createdAt;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Get all users (admin only - you can add role-based auth later)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select("-clerkId") // Don't expose clerk IDs
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ isActive: true });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Delete user account
const deleteUserAccount = async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

module.exports = {
  getCurrentUser,
  updateUserProfile,
  getAllUsers,
  deleteUserAccount,
};
