import Client from "../models/Client.js";
import mongoose from "mongoose";

export const getClientCourses = async (req, res) => {
  try {
    const clientId = req?.user?.clientId;

    // 1. Validate clientId existence
    if (!clientId) {
      return res.status(400).json({
        message: "Client ID missing in authenticated request.",
      });
    }

    // 2. Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        message: "Invalid client ID format.",
      });
    }

    // 3. Fetch client & select only courses
    const client = await Client.findById(clientId)
      .select("courses isActive institutionName")
      .lean();

    // 4. Case: Client not found
    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    // 5. Case: Inactive client access blocked
    if (!client.isActive) {
      return res.status(403).json({
        message: "Client is inactive. Contact super admin.",
      });
    }

    // 6. Case: Courses missing or empty
    if (!client.courses || client.courses.length === 0) {
      return res.status(200).json({
        institutionName: client.institutionName,
        courses: [],
        message: "No courses available for this client.",
      });
    }

    // 7. Success response
    return res.status(200).json({
      //   institutionName: client.institutionName,
      courses: client.courses,
    });
  } catch (error) {
    console.error("Error fetching client courses:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};
