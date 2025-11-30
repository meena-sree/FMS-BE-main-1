// models/StudentLead.js
import mongoose from "mongoose";

const digitalMarketingSchema = new mongoose.Schema({
  amount: {
    type: Number,
    min: 0,
  },
  paidTo: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
  },
});

const studentLeadSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
    },

    contact: {
      phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]{10}$/, "Invalid phone number"],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, "Invalid email"],
      },
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    specification: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    source: {
      type: String,
      required: true,
      enum: ["Franchise Enquiry", "Other"],
    },

    otherSource: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      default: "New",
      enum: ["New", "Converted", "Rejected"],
    },

    digitalMarketingPayment: digitalMarketingSchema,
  },
  { timestamps: true }
);

export default mongoose.model("StudentLead", studentLeadSchema);
