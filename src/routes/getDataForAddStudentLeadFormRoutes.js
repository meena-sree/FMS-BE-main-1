import express from "express";
import { getClientCourses } from "../controllers/getDataForAddStudentLeadForm.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
const router = express.Router();
//      /api/getLeadStudentData/franchise/courses-details
router.get(
  "/courses-details",
  authMiddleware,
  roleMiddleware("Franchise"),
  getClientCourses
);

export default router;
