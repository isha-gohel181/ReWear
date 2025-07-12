const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "tops",
        "bottoms",
        "dresses",
        "outerwear",
        "accessories",
        "shoes",
        "other",
      ],
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ["new", "like_new", "good", "fair", "worn"],
    },
    images: [
      {
        type: String, // URL or path to image
        required: true,
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    pointValue: {
      type: Number,
      required: true,
      default: 10,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "swapped", "inactive"],
      default: "pending",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Add indexes for common queries
itemSchema.index({ category: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ owner: 1 });

module.exports = mongoose.model("Item", itemSchema);
