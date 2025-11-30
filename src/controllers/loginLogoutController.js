import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getClientForRole } from "../utils/getClientForRole.js";
// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // Utility to create JWT token
// const generateToken = (user) => {
//   return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//     expiresIn: "7d", // Adjust as needed
//   });
// };

// // -----------------------------
// // ⭐ SUPER ADMIN LOGIN
// // -----------------------------
// export const superAdminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password)
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });

//     const user = await User.findOne({ email });

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Check role
//     if (user.role !== "SuperAdmin") {
//       return res.status(403).json({
//         message: "Only SuperAdmin can access this login",
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) return res.status(401).json({ message: "Invalid password" });

//     const token = generateToken(user);

//     // Set HTTP-only cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     res.json({
//       message: "SuperAdmin login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("SuperAdmin login error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // -----------------------------
// // ⭐ ADMIN LOGIN
// // -----------------------------
// export const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password)
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });

//     const user = await User.findOne({ email });

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Check role
//     if (user.role !== "Admin") {
//       return res.status(403).json({
//         message: "Only Admin accounts can login here",
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) return res.status(401).json({ message: "Invalid password" });

//     const token = generateToken(user);

//     // Set HTTP-only cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({
//       message: "Admin login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         clientId: user.clientId,
//       },
//     });
//   } catch (error) {
//     console.error("Admin login error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     // find user
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "Invalid credentials" });

//     // check credentials
//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch)
//       return res.status(401).json({ message: "Invalid credentials" });

//     // generate JWT
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // set cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     // dev: secure → false
//     // prod: secure → true

//     //     🔒 httpOnly: true
//     // Cookie cannot be accessed by JavaScript
//     // Protects from XSS attacks
//     // Only server can read/write the cookie

//     //     ✅ What is NODE_ENV?

//     // NODE_ENV tells your server what environment it is running in:

//     // Environment	    Meaning
//     // development	    running locally on your laptop
//     // production	    running on a live server (AWS, Render, Vercel, Railway, etc.)
//     // test	            used during automated testing

//     // 🔒 secure: process.env.NODE_ENV === "production"
//     // Cookie is sent only over HTTPS
//     // In dev mode (on localhost), HTTPS is usually not enabled
//     // So this becomes:
//     // false in development
//     // true in production
//     // If you don’t add this conditional and use secure: true on localhost → COOKIE WILL NOT SET, because HTTP cannot set a secure cookie.

//     // 🔒 sameSite: "strict"
//     // Browser sends the cookie only for same-site requests
//     // Prevents CSRF attacks
//     // Very safe for login cookies
//     // response

//     res.json({
//       message: ` login successful`,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         clientId: user.clientId ?? null,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Invalid credentials" });

    // ===========
    // ❗ 1. Check if user account is active
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Your account is not active. Please contact Admin." });
    }

    // console.log(user);
    // ⭐ 2. Get client based on role
    // const client = await getClientForRole(user);
    const { client, franchise } = await getClientForRole(user);

    // console.log(`hi from loginLogoutController franchise data${franchise} `);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // console.log(`this is from login ${user}`);

    // res.json({
    //   message: "Login successful",
    //   user: {
    //     id: user._id,
    //     name: user.name,
    //     email: user.email,
    //     role: user.role,
    //     clientId: user.clientId ?? null,
    //   },
    //   client: client
    //     ? {
    //         id: client?._id,
    //         logoUrl: client?.logoUrl,
    //         institutionName: client?.institutionName,
    //         institutionAddress: client?.institutionAddress,
    //         institutionPhone: client?.institutionPhone,
    //         franchiseFinance: client?.franchiseFinance,
    //         courses: client?.courses,
    //       }
    //     : null,
    // });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId ?? null,
        franchiseId: user.franchiseId ?? null,
      },

      client: client
        ? {
            // id: client._id,
            // logoUrl: client.logoUrl,
            // institutionName: client.institutionName,
            // institutionAddress: client.institutionAddress,
            // institutionPhone: client.institutionPhone,
            // courses: client.courses,
            id: client?._id,
            logoUrl: client?.logoUrl,
            institutionName: client?.institutionName,
            institutionAddress: client?.institutionAddress,
            institutionPhone: client?.institutionPhone,
            franchiseFinance: client?.franchiseFinance,
            courses: client?.courses,
          }
        : null,

      franchise: franchise
        ? {
            id: franchise._id,
            name: franchise.franchiseName,
            address: franchise.address,
            phone: franchise.ownerPhone,

            // branchAddress: franchise.branchAddress,
          }
        : null,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===================================================================
