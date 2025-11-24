import mongoose from "mongoose";

const franchiseLeadSchema = new mongoose.Schema(
  {
    // -----------------------
    // Lead Owner Information
    // -----------------------
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    fullAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // -----------------------
    // Assigned Manager
    // -----------------------
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    // -----------------------
    // Lead Status
    // -----------------------
    status: {
      type: String,
      enum: ["New", "In Progress", "Interested", "Not Interested", "Closed"],
      default: "New",
    },

    // -----------------------
    // Follow-up Notes
    // -----------------------
    notes: [
      {
        date: {
          type: Date,
          default: Date.now, // auto timestamp
        },
        time: {
          type: String, // "03:45 PM"
          required: true,
        },
        note: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("FranchiseLead", franchiseLeadSchema);
