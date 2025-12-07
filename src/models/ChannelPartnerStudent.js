// models/ChannelPartnerStudent.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  mode: {
    type: String,
    enum: ["Cash", "UPI", "Bank Transfer", "Card"],
    required: true,
  },
  //   transactionId: {
  //     type: String,
  //     trim: true,
  //   },
  receivedBy: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now, // auto timestamp for each payment
  },
});

const channelPartnerStudentSchema = new mongoose.Schema(
  {
    channelPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChannelPartner",
      required: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },

    course: {
      type: String,
      required: true,
    },

    // Total agreed course fee
    courseFee: {
      type: Number,
      default: 0,
    },

    // Auto updated when payments are made
    totalPaid: {
      type: Number,
      default: 0,
    },

    // 🟢 ARRAY OF PAYMENT OBJECTS
    payments: [paymentSchema],
  },
  { timestamps: true }
);

export default mongoose.model(
  "ChannelPartnerStudent",
  channelPartnerStudentSchema
);
