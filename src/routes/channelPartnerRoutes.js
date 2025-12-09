// routes/channelPartnerRoutes.js
import express from "express";
import {
  addChannelPartnerStudent,
  createChannelPartner,
  getChannelPartners,
  getChannelPartnerStudents,
} from "../controllers/channelPartnerController.js";
import {
  authMiddleware,
  roleMiddleware,
  //   verifyManager,
} from "../middleware/auth.js";
import { addPaymentToChannelPartnerStudent } from "../controllers/channelPartnerPaymentController.js";

const router = express.Router();
router.get("/list/students", authMiddleware, getChannelPartnerStudents);
//    /api/channel-partner/create/channel-partner

router.post(
  "/create/channel-partner",
  authMiddleware,
  roleMiddleware("Manager"),
  createChannelPartner
);
router.get("/", authMiddleware, roleMiddleware("Manager"), getChannelPartners);
router.post(
  "/add-payment/:studentId",
  authMiddleware,
  addPaymentToChannelPartnerStudent
);
//
router.post(
  "/channel-partner/students",
  authMiddleware,
  roleMiddleware("Manager"),
  addChannelPartnerStudent
);

export default router;
// ⭐ Want Additional Features?

// I can also generate:

// ✅ API to list all channel partners
// ✅ API to update partner commission
// ✅ API to add student under channel partner
// ✅ API to calculate commissions
// ✅ API to track payments for ChannelPartnerStudent
