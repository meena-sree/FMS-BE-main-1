import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Client from "../models/Client.js";

// ----------------------------
// Create Admin + Client
// Only SuperAdmin can access
// ----------------------------

export const createAdmin = async (req, res) => {
  try {
    // Check if the logged-in user is SuperAdmin
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      institutionName,
      institutionAddress,
      institutionPhone,
      logoUrl,
      name,
      email,
      password,
    } = req.body;

    // Basic validation
    if (
      !institutionName ||
      !institutionAddress ||
      !institutionPhone ||
      !logoUrl ||
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
        const normalizedEmail = String(email).toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // -------------------------
    // Create CLIENT first
    // -------------------------
    const client = await Client.create({
      SuperAdminId: req.user._id,
      institutionName,
      institutionAddress,
      institutionPhone,
      logoUrl,
      // Admin will later fill franchiseFinance + courses
    });

    // -------------------------
    // Create USER (Admin)
    // -------------------------
    const admin = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "Admin",
      clientId: client._id,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin,
      client,
    });
  } catch (error) {
    console.error("Error in createAdmin:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
// ================================================================================
// {
//   "institutionName": "Test Institute",
//   "institutionAddress": "MG Road, Bengaluru",
//   "institutionPhone": "9876543210",
//   "logoUrl": "/uploads/logo.png",

//   "name": "Ravi Kumar",
//   "email": "ravi.admin@gmail.com",
//   "password": "Admin123"
// }
// ================================================================================
