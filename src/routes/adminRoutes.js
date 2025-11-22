import express from "express";
// import { updateClientByAdmin } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { updateClientByAdmin } from "../controllers/adminController.js";
// import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.put("/client/update", authMiddleware, updateClientByAdmin);

export default router;
