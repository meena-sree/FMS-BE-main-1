import ChannelPartner from "../models/ChannelPartner.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const createChannelPartner = async (req, res) => {
  try {
    const { partnerName, phone, email, address, commissionPercent, password } =
      req.body;

    const managerId = req.user.managerId; // Logged-in manager

    // -----------------------------
    // 1️⃣ Basic Validations
    // -----------------------------
    if (!partnerName || !phone || !commissionPercent || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // email optional → only check if provided
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const existingPhone = await ChannelPartner.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // -----------------------------
    // 2️⃣ Create the Channel Partner
    // -----------------------------
    const newPartner = await ChannelPartner.create({
      managerId,
      partnerName,
      phone,
      email,
      address,
      commissionPercent,
    });

    // -----------------------------
    // 3️⃣ Create User login account
    // -----------------------------
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: partnerName,
      email,
      passwordHash,
      role: "ChannelPartner",
      channelPartnerId: newPartner._id,
      managerId,
    });

    return res.status(201).json({
      success: true,
      message: "Channel Partner created successfully",
      partner: newPartner,
      user: newUser,
    });
  } catch (error) {
    console.error("Create Channel Partner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
