import User from "../models/User.js";
import Client from "../models/Client.js"; // Existing Client model
import Franchise from "../models/Franchise.js"; // Placeholder model
import ChannelPartner from "../models/ChannelPartner.js"; // Placeholder model
import { checkActiveHierarchy } from "../middleware/checkActiveHierarchy.js"; // Import the middleware
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Function to dynamically fetch organization details based on the user's role
const getOrgDetails = async (user) => {
  const role = user.role;
  let orgData = null;

  try {
    switch (role) {
      case "Admin":
        if (user.clientId) {
          orgData = await Client.findById(user.clientId).lean();
        }
        break;
      case "Franchise":
        if (user.franchiseId) {
          // Fetch Franchise details
          orgData = await Franchise.findById(user.franchiseId).lean();
        }
        break;
      case "ChannelPartner":
        if (user.channelPartnerId) {
          // Fetch ChannelPartner details
          orgData = await ChannelPartner.findById(user.channelPartnerId).lean();
        }
        break;
      // SuperAdmin and Manager do not require extra top-level org details here
      default:
        break;
    }
  } catch (error) {
    console.error(
      `Error fetching organization details for role ${role}:`,
      error
    );
  }

  return orgData;
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Invalid credentials" });

    // 2. Check credentials
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // 3. 🚨 HIERARCHY CHECK: Block login if user or their Client is inactive
    const isAccessAllowed = await checkActiveHierarchy(user);
    if (!isAccessAllowed) {
      // checkActiveHierarchy handles console logging the reason for failure
      return res.status(403).json({
        message:
          "Access denied. Your account or your institution's account is currently inactive.",
      });
    }

    // 4. Role-based data fetching
    const organizationData = await getOrgDetails(user);

    // 5. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Set cookie (cookie logic preserved)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 7. Response with organization details
    res.json({
      message: `${user.role} login successful`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId ?? null,
      },
      organizationData: organizationData, // Include the fetched data here
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================================================
//  1. Differences Between React Router v6 and v7
// React Router v7 is a big upgrade over v6, designed to work smoothly with React 18/19, Suspense, and Streaming SSR.

// ✅ Key Differences (v6 → v7)
// 1. Hydration + Suspense changes
// v7 introduces HydrateFallback, better Suspense support, and fixes hydration warnings with React 18/19.
// That’s why you saw:
// No HydrateFallback element provided during initial hydration

// In v7, the router integrates with React’s new hydration APIs, so you MUST provide fallback UI.

// 2. Data Routers are rewritten internally
// createBrowserRouter, loader, action, and defer() are optimized.
// ✔ Less re-renders
// ✔ Better caching
// ✔ Faster navigation
// ✔ More predictable behavior

// 3. Simpler bundling and smaller footprint
// v7 removes some older APIs and improves tree-shaking.

// 4. RouterProvider now accepts new props
// v7 adds:
// fallbackElement
// <RouterProvider router={router} fallbackElement={<Loading />} />

// HydrateFallback
// HydrateFallback: <div>Loading...</div>

// Required for React 19 behavior.

// 5. Better SSR support
// React 18 streaming
// React 19’s new use hook
// Better hydration resumes

// v7 is built for future React versions.

// 6. Internal architectural rewrite
// Router internals are more modular.
// This does not change your code much, but improves reliability.

// 🚀 2. Why React 19 changed createBrowserRouter behavior
// React 19 changed how hydration and Suspense boundaries work.
// React Router team updated createBrowserRouter for compatibility.

// ⚡ React 19 changes that affect routing
// 1. React 19 requires explicit Suspense fallbacks during hydration
// Previously, React guessed fallback content.
// React 19 does NOT guess.
// You MUST give:

// fallbackElement (for navigation)

// HydrateFallback (for initial hydration)

// Otherwise React warns:
// No HydrateFallback element provided to render during initial hydration

// 2. React 19 improved router-aware hydration
// React 19 supports:
// ✔ Streaming SSR
// ✔ Partial hydration
// ✔ Resuming hydration after lazy-loaded routes
// To support this, createBrowserRouter() needs a Fallback UI.

// 3. React 19 enforces stricter boundaries
// React 19 is more strict about:
// Suspense boundaries
// Lazy loading
// Hydration consistency
// React Router v7 updated to match those new rules.

// 📌 Final Summary
// ✅ v6 → v7 improvements

// Better Suspense / hydration
// New fallbackElement
// New HydrateFallback
// Better SSR support
// Faster navigation
// Smaller bundle

// ✅ React 19 changes
// Requires explicit fallback UI during hydration
// Changes how lazy components mount
// Stricter hydration consistency
// Better support for streaming SSR

// ==================================================================================

import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    area: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 50,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 50,
    },
    zip: {
      type: String,
      required: [true, "ZIP/Postal code is required"],
      trim: true,
      match: [/^\d{6}$/, "ZIP must be exactly 6 digits"],
    },
  },
  { _id: false }
); // No _id for subdocument

const installmentSchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: [true, "Installment number required"],
      min: 1,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date required"],
    },
    originalAmount: {
      type: Number,
      required: [true, "Original amount required"],
      min: [0, "Amount cannot be negative"],
    },
    franchiseDiscount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      min: [0, "Final amount cannot be negative"],
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: [0, "GST cannot be negative"],
    },
    totalPayable: {
      type: Number,
      required: [true, "Total payable required"],
      min: [0, "Total payable cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "overdue", "waived"],
        message: "Status must be: pending, paid, overdue, or waived",
      },
      default: "pending",
    },
    paidDate: Date,
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    paymentMode: {
      type: String,
      enum: {
        values: ["cash", "online", "cheque", "waiver", null],
        message: "Payment mode must be: cash, online, cheque, waiver",
      },
    },
  },
  { _id: false }
);

const paidHistorySchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: [true, "Installment number required"],
      min: 1,
    },
    paidDate: {
      type: Date,
      required: [true, "Paid date required"],
    },
    paidAmount: {
      type: Number,
      required: [true, "Paid amount required"],
      min: [0.01, "Paid amount must be greater than 0"],
    },
    paymentMode: {
      type: String,
      required: [true, "Payment mode required"],
      enum: {
        values: ["cash", "online", "cheque", "waiver"],
        message: "Payment mode must be: cash, online, cheque, waiver",
      },
    },
    receiptNo: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    paidBy: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Course ID required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Course name required"],
      trim: true,
      maxlength: 100,
    },
    duration: {
      type: String,
      required: [true, "Duration required"],
      trim: true,
      maxlength: 50,
    },
    batch: {
      type: String,
      required: [true, "Batch required"],
      trim: true,
      maxlength: 50,
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, "Phone required"],
      match: [/^\d{10}$/, "Phone must be exactly 10 digits"],
    },
    email: {
      type: String,
      required: [true, "Email required"],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    qualification: {
      type: String,
      required: [true, "Qualification required"],
      trim: true,
      maxlength: 50,
    },
    yearOfPassout: {
      type: Number,
      required: [true, "Year of passout required"],
      min: [1900, "Invalid year"],
      max: [new Date().getFullYear() + 5, "Future year invalid"],
    },
    address: {
      type: addressSchema,
      required: [true, "Address required"],
    },
    courses: {
      type: [courseSchema],
      required: [true, "At least one course required"],
      minlength: [1, "At least one course required"],
    },
    payment: {
      totalFee: {
        type: Number,
        required: [true, "Total fee required"],
        min: [0, "Total fee cannot be negative"],
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, "Discount cannot be negative"],
      },
      finalFee: {
        type: Number,
        required: [true, "Final fee required"],
        min: [0, "Final fee cannot be negative"],
      },
      gst: {
        type: Number,
        default: 0,
        min: [0, "GST cannot be negative"],
      },
      installments: {
        type: [installmentSchema],
        required: [true, "Installments required"],
        validate: {
          validator: function (v) {
            return v.length > 0;
          },
          message: "At least one installment required",
        },
      },
      paidHistory: [paidHistorySchema],
    },
    FranchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: [true, "Franchise ID required"],
    },
    ManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Manager ID required"],
    },
    ClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID required"],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("Student", studentSchema);

// payment: {
//   totalFee: {
//     type: Number,
//     required: [true, "Total fee required"],
//     min: [0, "Total fee cannot be negative"],
//   },
//   discount: {
//     type: Number,
//     default: 0,
//     min: [0, "Discount cannot be negative"],
//   },
//   finalFee: {
//     type: Number,
//     required: [true, "Final fee required"],
//     min: [0, "Final fee cannot be negative"],
//   },
//   gst: {
//     type: Number,
//     default: 0,
//     min: [0, "GST cannot be negative"],
//   },
//   installments: {
//     type: [installmentSchema],
//     required: [true, "Installments required"],
//     validate: {
//       validator: function (v) {
//         return v.length > 0;
//       },
//       message: "At least one installment required",
//     },
//   },
//   paidHistory: [paidHistorySchema],
// },
