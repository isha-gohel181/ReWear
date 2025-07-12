const User = require("../models/User");
const Item = require("../models/Item");
const Swap = require("../models/Swap");

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied: Admin privileges required" });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({ error: "Error verifying admin status" });
  }
};

// Get all pending items for moderation
const getPendingItems = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pendingItems = await Item.find({ status: "pending", isActive: true })
      .populate("owner", "firstName lastName username profileImageUrl")
      .sort({ createdAt: 1 }) // Oldest first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments({
      status: "pending",
      isActive: true,
    });

    res.json({
      items: pendingItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting pending items:", error);
    res.status(500).json({ error: "Failed to get pending items" });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments({ isActive: true }),
      items: {
        total: await Item.countDocuments({ isActive: true }),
        pending: await Item.countDocuments({
          status: "pending",
          isActive: true,
        }),
        approved: await Item.countDocuments({
          status: "approved",
          isActive: true,
        }),
        rejected: await Item.countDocuments({
          status: "rejected",
          isActive: true,
        }),
        swapped: await Item.countDocuments({
          status: "swapped",
          isActive: true,
        }),
      },
      swaps: {
        total: await Swap.countDocuments(),
        pending: await Swap.countDocuments({ status: "pending" }),
        completed: await Swap.countDocuments({ status: "completed" }),
        rejected: await Swap.countDocuments({ status: "rejected" }),
      },
    };

    // Recent activity
    const recentItems = await Item.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("owner", "firstName lastName username");

    const recentSwaps = await Swap.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("requester", "firstName lastName username")
      .populate("provider", "firstName lastName username")
      .populate("requestedItem", "title")
      .populate("offeredItem", "title");

    res.json({
      stats,
      recentActivity: {
        items: recentItems,
        swaps: recentSwaps,
      },
    });
  } catch (error) {
    console.error("Error getting admin stats:", error);
    res.status(500).json({ error: "Failed to get admin dashboard statistics" });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

module.exports = {
  isAdmin,
  getPendingItems,
  getDashboardStats,
  updateUserRole,
};
