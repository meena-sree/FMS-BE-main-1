// routes/studentLeadRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createStudentLead } from "../controllers/createStudentLead.js";
// import { createStudentLead } from "../controllers/studentLeadController.js";
// import authMiddleware from "../middleware/auth.js";

const router = express.Router();
//              /api/getLeadStudentData/create-studentLead
router.post("/create-studentLead", authMiddleware, createStudentLead);

export default router;
