import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Manager", "Franchise", "ChannelPartner"],
      required: true,
    },

    // IDs for related models
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },

    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: false,
    },

    channelPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChannelPartner",
      required: false,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: false,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🔥 SINGLE merged validation hook
userSchema.pre("validate", async function (next) {
  const role = this.role;

  // -----------------------------
  // 1️⃣ Only one SuperAdmin allowed
  // -----------------------------
  if (role === "SuperAdmin") {
    const count = await mongoose.model("User").countDocuments({
      role: "SuperAdmin",
    });

    if (count > 0 && this.isNew) {
      return next(new Error("Only one SuperAdmin is allowed in the system"));
    }

    return next(); // SuperAdmin needs no ID checks
  }

  // -----------------------------------------
  // 2️⃣ Role-specific ID validation (ALL ROLES)
  // -----------------------------------------
  const roleRequirements = {
    Admin: { field: this.clientId, name: "clientId" },
    Franchise: { field: this.franchiseId, name: "franchiseId" },
    ChannelPartner: { field: this.channelPartnerId, name: "channelPartnerId" },
    Manager: { field: this.managerId, name: "managerId" },
  };

  const requirement = roleRequirements[role];

  if (!requirement) {
    return next(new Error(`Invalid role: ${role}`));
  }

  if (!requirement.field) {
    return next(
      new Error(`${requirement.name} is required for role "${role}"`)
    );
  }

  next();
});

export default mongoose.model("User", userSchema);
