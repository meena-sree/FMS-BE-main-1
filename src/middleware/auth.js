import jwt from "jsonwebtoken";
import User from "../models/User.js";

// export const authMiddleware = async (req, res, next) => {
//   try {
//     const { token } = req.cookies;
//     if (!token) {
//       return res.status(401).send("Please login!!!");
//     } else {
//       const decodedData = await jwt.verify(token, process.env.JWT_SECRET);
//       //   console.log(decodedData);
//       const user = await User.findById(decodedData.id).select("-password");
//       if (!user) {
//         throw new Error("user not found");
//       }
//       // Log user id, role, and path for debugging
//       console.log(
//         `Authenticated User: id = ${user._id || user.id}, role = ${
//           user.role
//         }, path = ${req.path}`
//       );
//       req.user = user;
//       next();
//     }
//   } catch (error) {
//     console.error("Auth error:", error.message);
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// Role-based guard

export const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log(
      `Authenticated → id: ${user._id}, role: ${user.role}, path: ${req.path}`
    );
    console.log(`the user from the authMiddleware   ${user}`);
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// export const roleMiddleware = (roles) => (req, res, next) => {
//   if (!req.user || !roles.includes(req.user.role)) {
//     // 🪵 Debug logging
//     console.log("🧑‍💻 Authenticated user:", req?.user?._id);
//     console.log("🎭 User role:", req?.user?.role);
//     console.log("🚀 Request:", method, originalUrl);
//     console.log("✅ Allowed roles:", roles);
//     return res.status(403).json({ message: "Access denied" });
//   }
//   next();
// };
export const roleMiddleware = (allowed) => (req, res, next) => {
  const roles = Array.isArray(allowed) ? allowed : [allowed];

  if (!req.user || !roles.includes(req.user.role)) {
    console.log("🔒 Access Denied");
    console.log("User:", req.user?._id);
    console.log("Role:", req.user?.role);
    console.log("Allowed:", roles);
    console.log("Path:", req.method, req.originalUrl);

    return res.status(403).json({ message: "Access denied" });
  }

  next();
};
