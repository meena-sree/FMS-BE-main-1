import express from "express";
import {
  calculateFranchiseAmounts,
  getFranchiseLeadAndClient,
} from "../controllers/getDataForAddFranchiseForm.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/manager/franchise-lead/:FranchiseLeadId",
  authMiddleware,
  roleMiddleware("Manager"),
  getFranchiseLeadAndClient
);
router.post(
  "/manager/calculateFranchiseAmounts",
  authMiddleware,
  roleMiddleware("Manager"),
  calculateFranchiseAmounts
);

export default router;
