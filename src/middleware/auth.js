import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please login!!!");
    } else {
      const decodedData = await jwt.verify(token, process.env.JWT_SECRET);
      //   console.log(decodedData);
      const user = await User.findById(decodedData.id).select("-password");
      if (!user) {
        throw new Error("user not found");
      }
      // Log user id, role, and path for debugging
      console.log(
        `Authenticated User: id = ${user._id || user.id}, role = ${
          user.role
        }, path = ${req.path}`
      );
      req.user = user;
      next();
    }
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role-based guard
export const roleMiddleware = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
