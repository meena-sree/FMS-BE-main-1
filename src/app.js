import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser"; // 👈 NEW IMPORT
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/superAdminRoutes.js";
import franchiseLeadRoutes from "./routes/franchiseLeadRoutes.js";
// import attendanceRoutes from "./routes/attendanceRoutes.js";
import { notFound } from "./middleware/not-found.js";
// import "./utils/scheduler.js"; // Import scheduler
import adminRoutes from "./routes/adminRoutes.js";
import certRoutes from "./routes/certRoutes.js";
import getLeadFranchiseDataRoutes from "./routes/getDataForAddFranchiseFormRoutes.js";
import getLeadStudentDataRoutes from "./routes/getDataForAddStudentLeadFormRoutes.js";
import studentLeadFDataRoutes from "./routes/studentLeadRoutes.js";
import studentDataRoutes from "./routes/StudentRouter.js";
import contactRoutes from "./routes/contactRoutes.js";
import franchiseRoutes from "./routes/franchiseRoutes.js";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();
// 🛑 ADD THIS CHECK HERE:
// console.log("SMTP User Loaded:", process.env.SMTP_USER ? "YES" : "NO");
// console.log(
//   "SMTP Pass Length:",
//   process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
// );
// 🛑 You should see YES and 16 (or a positive number)

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL, // Your frontend URL
//     credentials: true, // If you're using cookies/auth tokens
//   })
// );
// import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173", // your React frontend
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    exposedHeaders: ["Content-Disposition"],
  })
);

// Middleware
app.use(express.json()); // To parse incoming JSON requests

// 👈 USE COOKIE-PARSER HERE
app.use(cookieParser());

// Root route for server health check
app.get("/", (req, res) => {
  res.status(200).send("Testing API is running.");
});

// ----------------------------------------------------
// ===================================================
// ROUTE SETUP
// Mount the attendance router
// All routes defined in attendanceRoutes.js will be prefixed with /api/attendance
// app.use("/api/attendance", attendanceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager/franchise", franchiseLeadRoutes);
app.use("/api/certificate", certRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/getLeadFranchiseData", getLeadFranchiseDataRoutes);
app.use("/api/LeadStudentData", studentLeadFDataRoutes);
app.use("/api/getLeadStudentData", getLeadStudentDataRoutes);
app.use("/api/student-data", studentDataRoutes);
app.use("/api/franchises", franchiseRoutes);
// app.use("/api/user", attendanceRoutes);

// ----------------------------------------------------
app.use(notFound);
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start the server only after connecting to the database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
