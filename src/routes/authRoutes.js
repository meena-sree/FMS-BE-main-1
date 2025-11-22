import express from "express";
// import { superAdminLogin, adminLogin } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { login, logout } from "../controllers/loginLogoutController.js";

const router = express.Router();

// router.post("/superadmin/login", superAdminLogin);
router.post("/login", login);

router.post("/logout", authMiddleware, logout);

export default router;
