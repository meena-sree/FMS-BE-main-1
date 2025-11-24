import express from "express";
// import {
//   addFranchiseLead,
//   addLeadNote,
//   updateLeadStatus,
//   getManagerLeads,
//   getLeadById,
//   deleteLead,
// } from "../controllers/franchiseLeadController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
import {
  addFranchiseLead,
  addLeadNote,
  deleteLead,
  getLeadById,
  getManagerLeads,
  updateLeadStatus,
} from "../controllers/franchiseLeadController.js";

// import { auth } from "../middleware/auth.js";

const router = express.Router();
// Fix: Put static routes BEFORE dynamic routes

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("Manager"),
  addFranchiseLead
);
router.get(
  "/my-leads",
  authMiddleware,
  roleMiddleware("Manager"),
  getManagerLeads
);
// router.post("/:leadId/add-note", authMiddleware, addLeadNote);
// router.patch("/:leadId/status", authMiddleware, updateLeadStatus);

// router.get("/:leadId", authMiddleware, getLeadById);
// router.delete("/:leadId", authMiddleware, deleteLead);

export default router;
