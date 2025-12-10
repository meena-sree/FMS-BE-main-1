// src/controllers/franchiseController.js
import Franchise from "../models/Franchise.js";

export const getFranchises = async (req, res) => {
  try {
    // Basic filter: only active franchises with location
    const filter = { isActive: true, location: { $exists: true } };

    // find franchises and populate manager -> client
    // managerId must be an ObjectId ref to Manager
    // manager must have clientId ref to Client
    const franchises = await Franchise.find(filter)
      .populate({
        path: "managerId",
        select: "clientId", // only need clientId from manager
        populate: {
          path: "clientId",
          select: "institutionName logoUrl", // fields from client we want
        },
      })
      .select("franchiseName address location managerId ownerPhone")
      .lean();

    const formatted = franchises.map((f) => {
      // defensive access: manager may be null, client may be null
      const manager = f.managerId || null;
      const client = manager?.clientId || null;

      return {
        id: f._id,
        franchiseName: f.franchiseName || null,
        address: f.address || null,
        lat: f.location?.coordinates?.[1] ?? null,
        lng: f.location?.coordinates?.[0] ?? null,
        // client data if available
        institutionName: client?.institutionName || null,
        logoUrl: client?.logoUrl || null,
        // optional helper fields
        managerId: manager?._id || null,
        ownerPhone: f.ownerPhone || null,
      };
    });

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error("getFranchiseLocations error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch franchise locations" });
  }
};
