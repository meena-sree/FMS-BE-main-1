import FranchiseLead from "../models/FranchiseLead.js";

import Franchise from "../models/Franchise.js";
import Payment from "../models/Payment.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
// import FranchiseLead from "../models/FranchiseLead.js";

// ------------------------------------------------------
// 1️⃣ ADD NEW FRANCHISE LEAD
// ------------------------------------------------------
export const addFranchiseLead = async (req, res) => {
  try {
    const { ownerName, ownerEmail, ownerPhone, fullAddress } = req.body;

    if (!ownerName || !ownerEmail || !ownerPhone || !fullAddress) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // managerId comes from auth middleware
    const managerId = req.user.managerId;
    // console.log(managerId);

    if (!managerId) {
      return res.status(403).json({ message: "Only managers can add leads." });
    }

    const lead = await FranchiseLead.create({
      ownerName,
      ownerEmail,
      ownerPhone,
      fullAddress,
      managerId,
    });

    return res.status(201).json({
      message: "Franchise Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error("Add Franchise Lead Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------------------------------------------
// 2️⃣ ADD FOLLOW-UP NOTE (date + time + note)
// ------------------------------------------------------

// export const addLeadNote = async (req, res) => {
//   try {
//     const { leadId } = req.params;
//     const { time, note } = req.body;

//     if (!time || !note) {
//       return res.status(400).json({ message: "time and note are required." });
//     }

//     const lead = await FranchiseLead.findById(leadId);

//     if (!lead) {
//       return res.status(404).json({ message: "Lead not found" });
//     }

//     // Only assigned manager can add note
//     if (lead.managerId.toString() !== req.user.managerId) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     // Push follow-up entry
//     lead.notes.push({
//       date: new Date(),
//       time,
//       note,
//     });

//     lead.lastContactedAt = new Date();

//     await lead.save();

//     return res.status(200).json({
//       message: "Follow-up note added successfully",
//       lead,
//     });
//   } catch (error) {
//     console.error("Add Note Error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
export const addLeadNote = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ message: "note is required." });
    }

    const lead = await FranchiseLead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (lead.managerId.toString() !== req.user.managerId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    lead.notes.push({
      date: now,
      time: formattedTime,
      note,
    });

    await lead.save();

    return res.status(200).json({
      message: "Follow-up note added successfully",
    });
  } catch (error) {
    console.error("Add Note Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------------------------------------------
// 3️⃣ UPDATE LEAD STATUS
// ------------------------------------------------------
export const updateLeadStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    const allowed = [
      "New",
      "In Progress",
      "Interested",
      "Not Interested",
      "Closed",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const lead = await FranchiseLead.findById(leadId);

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Only assigned manager
    if (lead.managerId.toString() !== req.user.managerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    lead.status = status;
    await lead.save();

    return res.status(200).json({ message: "Status updated", lead });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------------------------------------------
// 4️⃣ GET LEADS FOR MANAGER (with filters + pagination)
// ------------------------------------------------------
// export const getManagerLeads = async (req, res) => {
//   try {
//     const managerId = req.user.managerId;

//     const { status, search, page = 1, limit = 10 } = req.query;

//     let filter = { managerId };

//     if (status) {
//       filter.status = status;
//     }

//     if (search) {
//       filter.$or = [
//         { ownerName: new RegExp(search, "i") },
//         { ownerEmail: new RegExp(search, "i") },
//         { ownerPhone: new RegExp(search, "i") },
//       ];
//     }

//     const skip = (page - 1) * limit;

//     const leads = await FranchiseLead.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     const total = await FranchiseLead.countDocuments(filter);

//     return res.status(200).json({
//       leads,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get Leads Error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
// import FranchiseLead from "../models/FranchiseLead.js";

export const getManagerLeads = async (req, res) => {
  try {
    // const managerId = req.user.id; // logged-in manager (user ID)
    const managerId = req.user.managerId; // logged-in manager (user ID)
    // console.log(managerId);
    // console.log(req.user.managerId);
    // console.log(req.user);

    // -----------------------
    // 1. Pagination values
    // -----------------------
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;

    const skip = (page - 1) * pageSize;

    // -----------------------
    // 2. Filters
    // -----------------------
    let filter = { managerId };

    if (req.query.name) {
      // case-insensitive search
      filter.ownerName = { $regex: req.query.name, $options: "i" };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.phone) {
      filter.ownerPhone = req.query.phone;
    }

    // Add future filters here...

    // -----------------------
    // 3. Get total BEFORE skip/limit
    // -----------------------
    const total = await FranchiseLead.countDocuments(filter);

    // -----------------------
    // 4. Fetch paginated results
    // -----------------------
    const leads = await FranchiseLead.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(pageSize);

    // -----------------------
    // 5. Pagination meta
    // -----------------------
    const pageCount = Math.ceil(total / pageSize);

    return res.status(200).json({
      success: true,

      meta: {
        page,
        pageSize,
        pageCount,
        total,
      },

      data: leads,
    });
  } catch (error) {
    console.error("GET MANAGER LEADS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------
// 5️⃣ GET SINGLE LEAD
// ------------------------------------------------------
export const getLeadById = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await FranchiseLead.findById(leadId);

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    return res.status(200).json({ lead });
  } catch (error) {
    console.error("Get Lead Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------------------------------------------
// 6️⃣ DELETE LEAD (optional)
// ------------------------------------------------------
export const deleteLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    await FranchiseLead.findByIdAndDelete(leadId);

    return res.status(200).json({ message: "Lead deleted" });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// to create a franchise

// export const createFranchise = async (req, res) => {
//   try {
//     const managerId = req.user.managerId; // from token
//     console.log(managerId);
//     const { FranchiseLeadId } = req.params;
//     console.log(FranchiseLeadId);

//     const { franchiseName, address, location } = req.body;
//     console.log(franchiseName, address, location);

//     const paymentData = req.body.payment; // frontend sends payment object

//     if (!paymentData) {
//       return res.status(400).json({ message: "Payment data required" });
//     }

//     // 1️⃣ Create Payment
//     const payment = await Payment.create(paymentData);

//     // 2️⃣ Create Franchise
//     const franchise = await Franchise.create({
//       franchiseName,
//       managerId,
//       address,
//       location,
//       paymentId: payment._id,
//     });

//     // 3️⃣ Update Lead Status → Enrolled
//     await FranchiseLead.findByIdAndUpdate(leadId, {
//       status: "Enrolled",
//     });

//     res.status(201).json({
//       message: "Franchise created successfully",
//       // data: franchise,
//     });
//   } catch (error) {
//     console.error("Create Franchise Error:", error);
//     res.status(500).json({ message: "Server error while creating franchise" });
//   }
// };

export const createFranchise = async (req, res) => {
  try {
    const managerId = req.user.managerId; // From token (logged-in manager)
    // console.log(managerId + "this is manager id");
    const clientId = req.user.clientId; // From token
    // console.log(clientId + "this is client id");
    const { FranchiseLeadId } = req.params;
    // console.log(FranchiseLeadId + "this is franchise lead Id");

    const {
      franchiseName,
      validUpTo,
      address,
      location,
      payment,
      franchiseEmail,
      ownerName,
      ownerPhone,
      franchisePassword,
      revenueSharePercent,
    } = req.body;
    // console.log(payment);
    // --- NEW VALIDATION BLOCK ---

    const isRevenueShareEmpty =
      revenueSharePercent === null ||
      revenueSharePercent === undefined ||
      revenueSharePercent === "";

    const isValidUpToEmpty =
      validUpTo === null || validUpTo === undefined || validUpTo === "";

    if (isRevenueShareEmpty || isValidUpToEmpty) {
      return res.status(400).json({
        message: "Revenue sharing terms are required.",
        errors: {
          revenueSharePercent: isRevenueShareEmpty
            ? "Revenue Share Percentage is required."
            : undefined,
          validUpTo: isValidUpToEmpty
            ? "Valid Up To date is required."
            : undefined,
        },
      });
    }
    if (!payment) {
      return res.status(400).json({ message: "Payment data required" });
    }

    // 1️⃣ Create Payment
    const paymentDoc = await Payment.create(payment);

    // 2️⃣ Create Franchise
    const franchise = await Franchise.create({
      franchiseName,
      ownerPhone,
      managerId,
      address,
      location,
      validUpTo,
      revenueSharePercent,
      paymentId: paymentDoc._id,
    });

    // 3️⃣ Create Franchise User
    // 3️⃣ Create Franchise User  (bcryptjs)
    const passwordHash = bcrypt.hashSync(franchisePassword, 10);

    const franchiseUser = await User.create({
      name: ownerName,
      email: franchiseEmail,
      passwordHash,
      role: "Franchise",
      franchiseId: franchise._id,
      managerId: managerId,
      clientId: clientId,
    });

    // 4️⃣ Update Lead Status → Enrolled
    await FranchiseLead.findByIdAndUpdate(FranchiseLeadId, {
      status: "Enrolled",
    });

    return res.status(201).json({
      message: "Franchise  created successfully",
      // franchiseId: franchise._id,
      // userId: franchiseUser._id,
    });
  } catch (error) {
    console.error("Create Franchise Error:", error);
    res.status(500).json({ message: "Server error while creating franchise" });
  }
};

// to get the notes for the particular lead
// GET /:leadId/notes
export const getLeadNotes = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await FranchiseLead.findById(leadId).select("notes managerId");
    // console.log(lead);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Only assigned manager can view notes
    if (lead.managerId.toString() !== req.user.managerId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Sort notes by date (latest first)
    const sortedNotes = [...lead.notes].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return res.status(200).json({
      message: "Notes fetched successfully",
      notes: sortedNotes,
    });
  } catch (error) {
    console.error("Get Notes Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// to update the status as "not interested" and add the reason for the same
// export const updateLeadStatusAsNotInterested = async (req, res) => {
//   try {
//     const { leadId } = req.params;
//     const { status, reason } = req.body;
//     // 1. Required field check
//     if (!reason || reason.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Reason is required",
//       });
//     }
//     // 2. Length validation
//     if (reason.length > 200) {
//       return res.status(400).json({
//         success: false,
//         message: "Reason must not exceed 200 characters",
//       });
//     }

//     // 1️⃣ Validate input
//     if (!status) {
//       return res.status(400).json({ message: "Status is required" });
//     }

//     // 2️⃣ If status = Not Interested, reason is mandatory
//     if (status === "Not Interested") {
//       if (!reason || reason.trim() === "") {
//         return res
//           .status(400)
//           .json({ message: "Reason is required for Not Interested status" });
//       }

//       if (reason.length > 200) {
//         return res
//           .status(400)
//           .json({ message: "Reason cannot exceed 200 characters" });
//       }
//     }

//     // 3️⃣ Fetch lead
//     const lead = await FranchiseLead.findById(leadId);

//     if (!lead) {
//       return res.status(404).json({ message: "Lead not found" });
//     }

//     // 4️⃣ Check manager access
//     if (lead.managerId.toString() !== req.user.managerId.toString()) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     // 5️⃣ Update fields
//     lead.status = status;

//     if (status === "Not Interested") {
//       lead.reason = reason;
//     } else {
//       lead.reason = null; // cleanup (optional)
//     }

//     await lead.save();

//     return res.status(200).json({
//       message: "Lead status updated successfully",
//       updatedLead: lead,
//     });
//   } catch (error) {
//     console.error("Update Lead Status Error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
// to update the status as "not interested" and add the reason for the same
// export const updateLeadStatusAsNotInterested = async (req, res) => {
//   try {
//     const { leadId } = req.params;
//     const { status, reason } = req.body;

//     // 1️⃣ Validate Status and Lead ID
//     if (!status) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Status is required" });
//     }

//     // 2️⃣ Enforce Reason for "Not Interested" status
//     if (status === "Not Interested") {
//       if (!reason || reason.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Reason is mandatory for Not Interested status",
//         });
//       }

//       if (reason.length > 200) {
//         return res.status(400).json({
//           success: false,
//           message: "Reason cannot exceed 200 characters",
//         });
//       }
//     }

//     // 3️⃣ Fetch lead
//     const lead = await FranchiseLead.findById(leadId);

//     if (!lead) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Lead not found" });
//     }

//     // 4️⃣ Check manager access
//     if (lead.managerId.toString() !== req.user.managerId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized: Lead does not belong to this manager",
//       });
//     }

//     // 5️⃣ Update and Save
//     lead.status = status;

//     // Conditionally set the reason field
//     if (status === "Not Interested") {
//       lead.reason = reason;
//     } else {
//       // Clear reason field if status is changed to something else
//       lead.reason = null;
//     }

//     await lead.save();

//     return res.status(200).json({
//       success: true,
//       message: "Lead status updated successfully",
//       updatedLead: lead,
//     });
//   } catch (error) {
//     console.error("Update Lead Status Error:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

// PUT /api/leads/:id/reason
// export const updateLeadReason = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;

//     // 1. Required field check
//     if (!reason || reason.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Reason is required",
//       });
//     }

//     // 2. Length validation
//     if (reason.length > 200) {
//       return res.status(400).json({
//         success: false,
//         message: "Reason must not exceed 200 characters",
//       });
//     }

//     // 3. Update reason
//     const updatedLead = await Lead.findByIdAndUpdate(
//       id,
//       { reason },
//       { new: true, runValidators: true }
//     );

//     if (!updatedLead) {
//       return res.status(404).json({
//         success: false,
//         message: "Lead not found",
//       });
//     }

//     return res.json({
//       // success: true,
//       message: "Reason updated successfully",
//       // data: updatedLead,
//     });
//   } catch (error) {
//     console.error("Error updating reason:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// to update the status as "not interested" and add the reason for the same
export const updateLeadStatusAsNotInterested = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { reason } = req.body; // 1. Status removed from req.body

    // 1. Required field check (for reason only)
    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reason is required for Not Interested status", // Specific error message for clarity
      });
    }

    // 2. Length validation (Reason must not exceed 200 characters)
    if (reason.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Reason must not exceed 200 characters",
      });
    }

    // 3️⃣ Fetch lead
    const lead = await FranchiseLead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    // console.log(lead + "from the lead");
    // console.log(req.user + "form the req.user");
    // 4️⃣ Check manager access
    if (lead.managerId.toString() !== req.user.managerId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 5️⃣ Update fields
    lead.status = "Not Interested"; // 4. Status explicitly set to "Not Interested"
    lead.reason = reason; // 3. Simplified reason assignment

    await lead.save();

    return res.status(200).json({
      message: "Lead status updated to 'Not Interested' successfully",
      updatedLead: lead,
    });
  } catch (error) {
    console.error("Update Lead Status Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
