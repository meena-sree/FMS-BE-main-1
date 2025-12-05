import express from "express";
// import { generatePaymentSlip } from "../controllers/paymentSlip.js";
import { downloadPaymentSlip } from "../controllers/paymentSlip.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
// import { generatePaymentSlip } from "../controllers/paymentSlip.controller.js";

const router = express.Router();
// // /api/student-payment-slip/payment-slip/:transactionId
// router.get("/payment-slip/:transactionId", generatePaymentSlip);

//

// routes/paymentSlipRoutes.js
// const express = require("express");
// const router = express.Router();
// // const paymentSlipController = require("../controllers/paymentSlipController");
// const { downloadPaymentSlip } = require("../controllers/paymentSlip");

// Download payment slip as PDF
// Download PDF
// /api/student-payment-slip/payment-slips/download/:studentId/:installmentNo
router.get(
  "/payment-slips/download/:studentId/installment/:installmentNo",
  authMiddleware,
  roleMiddleware("Franchise"),
  downloadPaymentSlip
);

// module.exports = router;
export default router;
