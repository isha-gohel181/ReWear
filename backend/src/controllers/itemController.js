const Item = require("../models/Item");
const User = require("../models/User");
const fs = require("fs").promises;
const path = require("path");

// Create new item
const createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      size,
      condition,
      tags,
      pointValue,
    } = req.body;
    const owner = await User.findOne({ clerkId: req.auth.userId });

    if (!owner) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle image files
    const images =
      req.files?.map((file) => `/uploads/items/${file.filename}`) || [];

    if (images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const newItem = new Item({
      title,
      description,
      category,
      type,
      size,
      condition,
      images,
      tags: tags?.split(",").map((tag) => tag.trim()) || [],
      pointValue: pointValue || 10,
      owner: owner._id,
    });

    await newItem.save();
    res.status(201).json({ item: newItem, message: "Item added successfully" });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
};

// Get all items with filters
const getItems = async (req, res) => {
  try {
    const {
      category,
      size,
      condition,
      search,
      page = 1,
      limit = 10,
      status = "approved",
    } = req.query;

    const query = { isActive: true };

    // Only admins can see pending/rejected items in the main listing
    const user = await User.findOne({ clerkId: req.auth?.userId });
    if (!user || user.role !== "admin") {
      query.status = status;
    }

    if (category) query.category = category;
    if (size) query.size = size;
    if (condition) query.condition = condition;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .populate("owner", "firstName lastName username profileImageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.json({
      items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting items:", error);
    res.status(500).json({ error: "Failed to get items" });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "owner",
      "firstName lastName username profileImageUrl"
    );

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ item });
  } catch (error) {
    console.error("Error getting item:", error);
    res.status(500).json({ error: "Failed to get item" });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const updateData = req.body;
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Check if user is owner or admin
    if (
      item.owner.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this item" });
    }

    // Handle new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(
        (file) => `/uploads/items/${file.filename}`
      );
      updateData.images = [...(item.images || []), ...newImages];
    }

    // Handle tags if provided as a string
    if (updateData.tags && typeof updateData.tags === "string") {
      updateData.tags = updateData.tags.split(",").map((tag) => tag.trim());
    }

    // If not an admin and item was approved, set status back to pending
    if (user.role !== "admin" && item.status === "approved") {
      updateData.status = "pending";
    }

    const updatedItem = await Item.findByIdAndUpdate(itemId, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ item: updatedItem, message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Check if user is owner or admin
    if (
      item.owner.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this item" });
    }

    // Soft delete by setting isActive to false
    await Item.findByIdAndUpdate(itemId, {
      isActive: false,
      status: "inactive",
    });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// Admin: Approve or reject item
const moderateItem = async (req, res) => {
  try {
    const { itemId, status, moderationNotes } = req.body;
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Not authorized for moderation actions" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      {
        status,
        moderationNotes,
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({
      item: updatedItem,
      message: `Item ${
        status === "approved" ? "approved" : "rejected"
      } successfully`,
    });
  } catch (error) {
    console.error("Error moderating item:", error);
    res.status(500).json({ error: "Failed to moderate item" });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  moderateItem,
};
