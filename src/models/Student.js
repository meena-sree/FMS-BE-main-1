import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    area: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 50,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 50,
    },
    zip: {
      type: String,
      required: [true, "ZIP/Postal code is required"],
      trim: true,
      match: [/^\d{6}$/, "ZIP must be exactly 6 digits"],
    },
    country: {
      type: String,
      default: "India",
      trim: true,
      maxlength: 50,
    },
  },
  { _id: false }
); // No _id for subdocument

const installmentSchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: [true, "Installment number required"],
      min: 1,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date required"],
    },
    originalAmount: {
      type: Number,
      required: [true, "Original amount required"],
      min: [0, "Amount cannot be negative"],
    },
    franchiseDiscount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      min: [0, "Final amount cannot be negative"],
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: [0, "GST cannot be negative"],
    },
    totalPayable: {
      type: Number,
      required: [true, "Total payable required"],
      min: [0, "Total payable cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "overdue", "waived"],
        message: "Status must be: pending, paid, overdue, or waived",
      },
      default: "pending",
    },
    paidDate: Date,
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
  },
  { _id: false }
);

const paidHistorySchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: [true, "Installment number required"],
      min: 1,
    },
    paidDate: {
      type: Date,
      required: [true, "Paid date required"],
    },
    paidAmount: {
      type: Number,
      required: [true, "Paid amount required"],
      min: [0.01, "Paid amount must be greater than 0"],
    },

    receiptNo: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Course ID required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Course name required"],
      trim: true,
      maxlength: 100,
    },
    // duration: {
    //   type: String,
    //   required: [true, "Duration required"],
    //   trim: true,
    //   maxlength: 50,
    // },
    // batch: {
    //   type: String,
    //   required: [true, "Batch required"],
    //   trim: true,
    //   maxlength: 50,
    // },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, "Phone required"],
      match: [/^\d{10}$/, "Phone must be exactly 10 digits"],
    },
    email: {
      type: String,
      required: [true, "Email required"],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    qualification: {
      type: String,
      required: [true, "Qualification required"],
      trim: true,
      maxlength: 50,
    },
    yearOfPassout: {
      type: Number,
      required: [true, "Year of passout required"],
      min: [1900, "Invalid year"],
      max: [new Date().getFullYear() + 5, "Future year invalid"],
    },
    address: {
      type: addressSchema,
      required: [true, "Address required"],
    },
    courses: {
      type: [courseSchema],
      required: [true, "At least one course required"],
      minlength: [1, "At least one course required"],
    },

    payment: [
      {
        totalFee: {
          type: Number,
          required: [true, "Total fee required"],
          min: [0, "Total fee cannot be negative"],
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Discount cannot be negative"],
        },
        finalFee: {
          type: Number,
          required: [true, "Final fee required"],
          min: [0, "Final fee cannot be negative"],
        },
        gst: {
          type: Number,
          default: 0,
          min: [0, "GST cannot be negative"],
        },
        installments: {
          type: [installmentSchema],
          default: [],
          required: [true, "Installments required"],
          validate: [
            {
              validator: function (v) {
                return v.length > 0;
              },
              message: "At least one installment required",
            },
            {
              validator: function (v) {
                const dates = v.map((inst) => new Date(inst.dueDate).getTime());
                return new Set(dates).size === dates.length;
              },
              message: "Installments must have unique due dates",
            },
            {
              validator: function (v) {
                const numbers = v.map((i) => i.installmentNo);
                return numbers.every((n, idx) => n === idx + 1);
              },
              message: "Installment numbers must be sequential starting from 1",
            },
          ],
        },
        paidHistory: {
          type: [paidHistorySchema],
          default: [],
        },
      },
    ],
    FranchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: [true, "Franchise ID required"],
    },
    ManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Manager ID required"],
    },
    ClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID required"],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Schema-level validation for finalFee consistency
// Pre-save hook for automatic installment finalAmount calculation
studentSchema.pre("save", function (next) {
  if (this.payment && this.payment.length > 0) {
    this.payment.forEach((p) => {
      // Recalculate finalFee
      p.finalFee = p.totalFee - p.discount + p.gst;

      // Ensure installments have finalAmount calculated
      p.installments.forEach((inst) => {
        inst.finalAmount =
          inst.originalAmount - inst.franchiseDiscount + inst.gstAmount;
      });
    });
  }
  next();
});

export default mongoose.model("Student", studentSchema);
