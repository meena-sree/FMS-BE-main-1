import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

// const MONGO_URI = "mongodb://localhost:27017/yourdb"; // update this

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const exists = await User.findOne({ role: "SuperAdmin" });
    if (exists) {
      console.log("❌ SuperAdmin already exists");
      return process.exit(0);
    }

    const passwordHash = await bcrypt.hash("AdminSnipe@987", 10);

    const admin = await User.create({
      name: "Super Admin",
      email: "superadmin@example.com",
      passwordHash,
      role: "SuperAdmin",
      //   clientId: "675b3fea88e12f89abc12345", // set your client ID
    });

    console.log("✅ SuperAdmin created:", admin.email);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createSuperAdmin();
