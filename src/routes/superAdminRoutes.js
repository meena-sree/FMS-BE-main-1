import express from "express";
import { createAdmin } from "../controllers/superAdminController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
// import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/create-admin",
  authMiddleware,
  roleMiddleware(["SuperAdmin"]),
  createAdmin
);

export default router;
