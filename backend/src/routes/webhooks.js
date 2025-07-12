//backend/src/routes/users.js
const express = require("express");
const { Webhook } = require("svix");
const User = require("../models/User");

const router = express.Router();

// Webhook endpoint for Clerk events
router.post(
  "/clerk",
  express.raw({ type: "application/json" }), // required for svix signature validation
  async (req, res) => {
    try {
      const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

      if (!WEBHOOK_SECRET) {
        throw new Error("Please add CLERK_WEBHOOK_SECRET to your .env file");
      }

      // Get Svix headers
      const svix_id = req.get("svix-id");
      const svix_timestamp = req.get("svix-timestamp");
      const svix_signature = req.get("svix-signature");

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: "Missing Svix headers" });
      }

      // Parse raw body
      const payloadString = req.body.toString("utf8");

      const wh = new Webhook(WEBHOOK_SECRET);
      let evt;

      try {
        evt = wh.verify(payloadString, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        });
      } catch (err) {
        console.error("❌ Webhook signature verification failed:", err);
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Parse the payload and handle the event
      const eventData = JSON.parse(payloadString);
      const { id } = eventData.data;
      const eventType = eventData.type;

      console.log(`✅ Webhook received | Type: ${eventType}, ID: ${id}`);

      switch (eventType) {
        case "user.created":
          await handleUserCreated(eventData.data);
          break;
        case "user.updated":
          await handleUserUpdated(eventData.data);
          break;
        case "user.deleted":
          await handleUserDeleted(eventData.data);
          break;
        case "session.created":
          await handleSessionCreated(eventData.data);
          break;
        default:
          console.log(`⚠️ Unhandled event type: ${eventType}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("🔥 Webhook error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Helper: user.created
async function handleUserCreated(data) {
  try {
    const userData = {
      clerkId: data.id,
      email: data.email_addresses[0]?.email_address || "",
      firstName: data.first_name || "User",
      lastName: data.last_name || "Unknown",
      profileImageUrl: data.image_url || "",
      emailVerified:
        data.email_addresses[0]?.verification?.status === "verified",
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    const user = new User(userData);
    await user.save();

    console.log("✅ User saved to DB:", user._id);
  } catch (error) {
    console.error("❌ Failed to save user:", error);
  }
}

// Helper: user.updated
async function handleUserUpdated(data) {
  try {
    const updateData = {
      email: data.email_addresses[0]?.email_address || "",
      firstName: data.first_name || "User",
      lastName: data.last_name || "Unknown",
      profileImageUrl: data.image_url || "",
      emailVerified:
        data.email_addresses[0]?.verification?.status === "verified",
      updatedAt: new Date(data.updated_at),
    };

    // Only set username if it exists
    if (data.username) {
      updateData.username = data.username;
    }

    const user = await User.findOneAndUpdate({ clerkId: data.id }, updateData, {
      new: true,
    });

    console.log("📝 User updated in DB:", user?._id);
  } catch (error) {
    console.error("❌ Failed to update user:", error);
  }
}

// Helper: user.deleted
async function handleUserDeleted(data) {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: data.id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    console.log("🚫 User deactivated in DB:", user?._id);
  } catch (error) {
    console.error("❌ Failed to deactivate user:", error);
  }
}

// Helper: session.created
async function handleSessionCreated(data) {
  try {
    await User.findOneAndUpdate(
      { clerkId: data.user_id },
      { lastSignInAt: new Date(data.created_at) },
      { new: true }
    );

    console.log("🔐 User session updated:", data.user_id);
  } catch (error) {
    console.error("❌ Failed to update session info:", error);
  }
}

module.exports = router;
