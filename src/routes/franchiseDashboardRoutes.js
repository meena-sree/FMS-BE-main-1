// routes/dashboardRoutes.js
import express from "express";
// import { getFranchiseDashboard, getStudentAnalytics } from '../controllers/dashboardController.js';
// import { authenticate, authorize } from '../middleware/auth.js';
import {
  getFranchiseDashboard,
  getStudentAnalytics,
} from "../controllers/franchiseDashboardController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get franchise dashboard data
router.get(
  "/dashboard/franchise",
  authMiddleware,
  roleMiddleware("Franchise"),
  getFranchiseDashboard
);

// Get detailed student analytics
router.get(
  "/dashboard/franchise/analytics",
  authMiddleware,
  roleMiddleware("Franchise"),
  getStudentAnalytics
);
//    /api/franchise-dashboard/dashboard/franchise/analytics
//    /api/franchise-dashboard/dashboard/franchise
export default router;
