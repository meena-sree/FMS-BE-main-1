// src/routes/franchiseRoutes.js
import express from "express";
import { getFranchises } from "../controllers/franchiseController.js";
const router = express.Router();

// GET /api/franchises
router.get("/locations", getFranchises);

export default router;
