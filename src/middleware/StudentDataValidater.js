
import { body } from "express-validator";

// Custom validation middleware (use before controller)
export const validateStudentData = [
  // Basic fields
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 }),
  body("phone")
    .trim()
    .isLength({ min: 10, max: 10 })
    .matches(/^\d{10}$/)
    .withMessage("Phone must be exactly 10 digits"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("qualification").trim().notEmpty().isLength({ max: 50 }),
  body("yearOfPassout")
    .isInt({ min: 1900, max: 2030 })
    .withMessage("Valid year required"),

  // Address validation
  body("address.city").trim().notEmpty().isLength({ max: 50 }),
  body("address.state").trim().notEmpty().isLength({ max: 50 }),
  body("address.zip")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("ZIP must be 6 digits"),

  // Payment validation
  body("payment.totalFee").isFloat({ min: 0 }),
  body("payment.finalFee").isFloat({ min: 0 }),
  body("payment.discount").optional().isFloat({ min: 0 }),
  body("payment.gst").optional().isFloat({ min: 0 }),
  body("payment.installments")
    .isArray({ min: 1 })
    .withMessage("At least one installment required"),
];
