const mongoose = require("mongoose");

const swapSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    offeredItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    type: {
      type: String,
      enum: ["direct_swap", "point_redemption"],
      required: true,
    },
    pointsExchanged: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Add indexes for common queries
swapSchema.index({ requester: 1 });
swapSchema.index({ provider: 1 });
swapSchema.index({ status: 1 });

module.exports = mongoose.model("Swap", swapSchema);
