import express from "express";
// import { updateClientByAdmin } from "../controllers/adminController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
import { updateClientByAdmin } from "../controllers/adminController.js";
// import authMiddleware from "../middleware/auth.js";
import { addManager } from "../controllers/adminController.js";

const router = express.Router();

router.put(
  "/client/update",
  authMiddleware,
  roleMiddleware("Admin"),
  updateClientByAdmin
);

// routes/managerRoutes.js

router.post(
  "/add-manager",
  authMiddleware,
  roleMiddleware("Admin"),
  addManager
);
export default router;
