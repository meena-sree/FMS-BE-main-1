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
