// models/Franchise.js
import mongoose from "mongoose";

const franchiseSchema = new mongoose.Schema(
  {
    franchiseName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revenueSharePercent: { type: Number, default: 0 }, // set by Manager during onboarding
    validUpTo: {
      type: Date, // Use the Date type for storing dates
      required: true, // Typically required for a finite agreement
      default: null, // Can be set to null or a future date initially
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    // GeoJSON: Location (Point)
    location: {
      //   type: {
      //     type: String,
      //     enum: ["Point"],
      //     default: "Point",
      //   },
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: function (value) {
            return value.length === 2;
          },
          message: "Location must contain exactly [longitude, latitude]",
        },
      },
    },

    // Reference to Payment Document
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to enable Geo queries
franchiseSchema.index({ location: "2dsphere" });

export default mongoose.model("Franchise", franchiseSchema);

// {
//   "franchiseName": "Tech Campus",
//   "managerId": "671ac2d9e1a3f566bb5b120a",
//   "address": "No.21, MG Road, Bangalore",
//   "location": {
//     "type": "Point",
//     "coordinates": [77.5946, 12.9716]
//   },
//   "paymentId": "671ac4d31a1e9e67cb1221f"
// }
