const Swap = require("../models/Swap");
const User = require("../models/User");
const Item = require("../models/Item");

// Request a swap or point redemption
const requestSwap = async (req, res) => {
  try {
    const { requestedItemId, offeredItemId, type } = req.body;
    const requesterClerkId = req.auth.userId;

    // Get requester user
    const requester = await User.findOne({ clerkId: requesterClerkId });
    if (!requester) {
      return res.status(404).json({ error: "Requester not found" });
    }

    // Get requested item and validate
    const requestedItem = await Item.findById(requestedItemId);
    if (
      !requestedItem ||
      !requestedItem.isActive ||
      requestedItem.status !== "approved"
    ) {
      return res
        .status(404)
        .json({ error: "Requested item not found or unavailable" });
    }

    // Get provider user
    const provider = await User.findById(requestedItem.owner);
    if (!provider) {
      return res.status(404).json({ error: "Item owner not found" });
    }

    // Prevent self-swapping
    if (requester._id.toString() === provider._id.toString()) {
      return res.status(400).json({ error: "Cannot request your own item" });
    }

    let pointsExchanged = 0;
    let offeredItem = null;

    // Handle different swap types
    if (type === "direct_swap") {
      if (!offeredItemId) {
        return res
          .status(400)
          .json({ error: "Offered item ID required for direct swaps" });
      }

      // Validate offered item
      offeredItem = await Item.findById(offeredItemId);
      if (
        !offeredItem ||
        !offeredItem.isActive ||
        offeredItem.status !== "approved"
      ) {
        return res
          .status(404)
          .json({ error: "Offered item not found or unavailable" });
      }

      // Check if requester owns the offered item
      if (offeredItem.owner.toString() !== requester._id.toString()) {
        return res
          .status(403)
          .json({ error: "You don't own this offered item" });
      }
    } else if (type === "point_redemption") {
      pointsExchanged = requestedItem.pointValue;

      // Check if requester has enough points
      if (requester.points < pointsExchanged) {
        return res
          .status(400)
          .json({ error: "Insufficient points for this redemption" });
      }
    } else {
      return res.status(400).json({ error: "Invalid swap type" });
    }

    // Create swap request
    const newSwap = new Swap({
      requester: requester._id,
      provider: provider._id,
      requestedItem: requestedItem._id,
      offeredItem: offeredItemId,
      type,
      pointsExchanged,
      status: "pending",
    });

    await newSwap.save();

    res.status(201).json({
      swap: newSwap,
      message: "Swap request created successfully",
    });
  } catch (error) {
    console.error("Error requesting swap:", error);
    res.status(500).json({ error: "Failed to request swap" });
  }
};

// Respond to a swap request
const respondToSwap = async (req, res) => {
  try {
    const { swapId, response } = req.body;
    const providerClerkId = req.auth.userId;

    if (!["accepted", "rejected"].includes(response)) {
      return res.status(400).json({ error: "Invalid response type" });
    }

    // Get provider user
    const provider = await User.findOne({ clerkId: providerClerkId });
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // Get swap and validate
    const swap = await Swap.findById(swapId);
    if (!swap) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Verify provider owns the item
    if (swap.provider.toString() !== provider._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to respond to this swap" });
    }

    // Check if swap is still pending
    if (swap.status !== "pending") {
      return res
        .status(400)
        .json({ error: "This swap request is no longer pending" });
    }

    // Update swap status
    swap.status = response;

    // If accepted, process the swap
    if (response === "accepted") {
      // Get the items and users involved
      const requestedItem = await Item.findById(swap.requestedItem);
      const requester = await User.findById(swap.requester);

      if (!requestedItem || !requester) {
        return res
          .status(404)
          .json({ error: "Item or requester no longer exists" });
      }

      // For point redemption
      if (swap.type === "point_redemption") {
        // Verify requester still has enough points
        if (requester.points < swap.pointsExchanged) {
          swap.status = "rejected";
          await swap.save();
          return res
            .status(400)
            .json({ error: "Requester no longer has enough points" });
        }

        // Update points
        requester.points -= swap.pointsExchanged;
        provider.points += swap.pointsExchanged;

        // Update item status
        requestedItem.status = "swapped";

        await requester.save();
        await provider.save();
        await requestedItem.save();
      }
      // For direct swap
      else if (swap.type === "direct_swap" && swap.offeredItem) {
        const offeredItem = await Item.findById(swap.offeredItem);

        if (!offeredItem) {
          return res
            .status(404)
            .json({ error: "Offered item no longer exists" });
        }

        // Update both items' status
        requestedItem.status = "swapped";
        offeredItem.status = "swapped";

        await requestedItem.save();
        await offeredItem.save();
      }

      // Complete the swap
      swap.status = "completed";
    }

    await swap.save();

    res.json({
      swap,
      message: `Swap ${
        response === "accepted" ? "accepted and completed" : "rejected"
      }`,
    });
  } catch (error) {
    console.error("Error responding to swap:", error);
    res.status(500).json({ error: "Failed to respond to swap" });
  }
};

// Get user's swap requests (as requester or provider)
const getUserSwaps = async (req, res) => {
  try {
    const userClerkId = req.auth.userId;
    const { status, role, page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const query = {};

    // Filter by user role in swaps
    if (role === "requester") {
      query.requester = user._id;
    } else if (role === "provider") {
      query.provider = user._id;
    } else {
      // Default: show all swaps the user is involved in
      query.$or = [{ requester: user._id }, { provider: user._id }];
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swaps = await Swap.find(query)
      .populate("requester", "firstName lastName username profileImageUrl")
      .populate("provider", "firstName lastName username profileImageUrl")
      .populate("requestedItem", "title images category status")
      .populate("offeredItem", "title images category status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Swap.countDocuments(query);

    res.json({
      swaps,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting user swaps:", error);
    res.status(500).json({ error: "Failed to get swaps" });
  }
};

// Add message to swap
const addSwapMessage = async (req, res) => {
  try {
    const { swapId, content } = req.body;
    const userClerkId = req.auth.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const swap = await Swap.findById(swapId);
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }

    // Check if user is part of this swap
    if (
      swap.requester.toString() !== user._id.toString() &&
      swap.provider.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to message in this swap" });
    }

    // Add message
    swap.messages.push({
      sender: user._id,
      content,
      timestamp: new Date(),
    });

    await swap.save();

    res.json({
      message: "Message sent successfully",
      swap,
    });
  } catch (error) {
    console.error("Error adding swap message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

module.exports = {
  requestSwap,
  respondToSwap,
  getUserSwaps,
  addSwapMessage,
};
