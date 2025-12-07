// models/ChannelPartner.js
import mongoose from "mongoose";

const channelPartnerSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    partnerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },
    // total earnings
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },

    // how much paid out to partner
    totalCommissionPaid: {
      type: Number,
      default: 0,
    },

    // pending commission
    pendingCommission: {
      type: Number,
      default: 0,
    },
    // Commission percentage for this partner (0–100)
    commissionPercent: {
      type: Number,
      required: true,
      min: [0, "Commission cannot be negative"],
      max: [100, "Commission cannot exceed 100"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChannelPartner", channelPartnerSchema);
