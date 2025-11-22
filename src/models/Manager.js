import mongoose from "mongoose";

const managerSchema = new mongoose.Schema(
  {
    // Admin who created this manager
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Manager belongs to a client (institution)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ============================================
    // ✔ allowedRegion field supports:
    //   - "all" → manager can access all regions
    //   - Polygon (GeoJSON)
    //   - MultiPolygon (GeoJSON)
    // ============================================
    allowedRegion: {
      type: mongoose.Schema.Types.Mixed, 
      required: true,
      // Example:
      // "all"
      // { type: "Polygon", coordinates: [...] }
      // { type: "MultiPolygon", coordinates: [...] }
    },
  },
  { timestamps: true }
);

// ============================================
// ✔ GEOJSON 2dsphere INDEX (PARTIAL)
//   Applied only when allowedRegion contains a GeoJSON type.
//   Prevents MongoDB errors when allowedRegion = "all" (string).
// ============================================
managerSchema.index(
  { allowedRegion: "2dsphere" },
  {
    partialFilterExpression: {
      "allowedRegion.type": { $exists: true }, // Only create index when GeoJSON
    },
  }
);

export default mongoose.model("Manager", managerSchema);
