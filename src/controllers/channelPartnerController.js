import ChannelPartner from "../models/ChannelPartner.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const createChannelPartner = async (req, res) => {
  try {
    const { partnerName, phone, email, address, commissionPercent, password } =
      req.body;
    // console.log(req.user + "this is from the channel partner controller");

    const managerId = req.user.managerId; // Logged-in manager

    // -----------------------------
    // 1️⃣ Basic Validations
    // -----------------------------
    if (!partnerName || !phone || !commissionPercent || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // email optional → only check if provided
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const existingPhone = await ChannelPartner.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // -----------------------------
    // 2️⃣ Create the Channel Partner
    // -----------------------------
    const newPartner = await ChannelPartner.create({
      managerId,
      partnerName,
      phone,
      email,
      address,
      commissionPercent,
    });

    // -----------------------------
    // 3️⃣ Create User login account
    // -----------------------------
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: partnerName,
      email,
      passwordHash,
      role: "ChannelPartner",
      channelPartnerId: newPartner._id,
      managerId,
    });

    return res.status(201).json({
      success: true,
      message: "Channel Partner created successfully",
      partner: newPartner,
      user: newUser,
    });
  } catch (error) {
    console.error("Create Channel Partner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getChannelPartners = async (req, res) => {
  try {
    const managerId = req.user.managerId; // logged-in manager

    // -----------------------
    // 1️⃣ Filters
    // -----------------------
    let { name, phone, page = 1 } = req.query;
    // const pageSize = 10;
    page = Number(page);
    // pageSize = Number(pageSize);
    let pageSize = 10;

    const filter = { managerId };

    if (name && name.trim() !== "") {
      filter.partnerName = { $regex: name, $options: "i" }; // case-insensitive search
    }

    if (phone && phone.trim() !== "") {
      filter.phone = { $regex: phone, $options: "i" };
    }

    // -----------------------
    // 2️⃣ Count Documents
    // -----------------------
    const total = await ChannelPartner.countDocuments(filter);

    // -----------------------
    // 3️⃣ Pagination Logic
    // -----------------------
    const pageCount = Math.ceil(total / pageSize);

    const partners = await ChannelPartner.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // -----------------------
    // 4️⃣ Response
    // -----------------------
    return res.status(200).json({
      success: true,
      data: partners,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get Channel Partners Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

import ChannelPartnerStudent from "../models/ChannelPartnerStudent.js";
// import ChannelPartner from "../models/ChannelPartner.js";

/**
 * Add Channel Partner Student
 * Body:
 * - channelPartnerId
 * - studentName
 * - phone
 * - course
 * - courseFee
 * - firstPayment { amount, mode, receivedBy }
 */
export const addChannelPartnerStudent = async (req, res) => {
  try {
    const managerId = req.user.managerId; // from auth middleware
    console.log(req.user);

    const {
      studentName,
      phone,
      course,
      courseFee,
      firstPayment,
      channelPartnerId,
    } = req.body;
    console.log(`this is from the channelparner student controller `);
    console.log(`=======================================================`);
    console.log(
      studentName,
      phone,
      course,
      courseFee,
      firstPayment,
      channelPartnerId
    );
    console.log(`=======================================================`);

    if (!channelPartnerId || !studentName || !phone || !course) {
      return res
        .status(400)
        .json({ message: "Missing required fields.", success: false });
    }

    // 🔍 Verify channel partner belongs to logged-in manager
    const partner = await ChannelPartner.findOne({
      _id: channelPartnerId,
      managerId,
    });

    if (!partner) {
      return res.status(404).json({
        message: "Channel Partner not found or not assigned to manager.",
        success: false,
      });
    }

    // New student object
    let newStudentData = {
      channelPartnerId,
      managerId,
      studentName,
      phone,
      course,
      courseFee: courseFee || 0,
      totalPaid: 0,
      payments: [],
    };

    let commissionToAdd = 0;

    // Handle optional first payment
    if (firstPayment && firstPayment.amount) {
      const paymentObj = {
        amount: firstPayment.amount,
        mode: firstPayment.mode,
        receivedBy: req.user.name,
      };

      newStudentData.payments.push(paymentObj);
      newStudentData.totalPaid = firstPayment.amount;

      // 💰 Commission calculation
      const percent = partner.commissionPercent / 100;
      commissionToAdd = firstPayment.amount * percent;
    }

    // Create student
    const newStudent = await ChannelPartnerStudent.create(newStudentData);

    // Update Channel Partner commission
    if (commissionToAdd > 0) {
      partner.totalCommissionEarned += commissionToAdd;
      partner.pendingCommission += commissionToAdd;
      await partner.save();
    }

    return res.status(201).json({
      message: "Channel Partner student added successfully.",
      success: true,
      data: newStudent,
    });
  } catch (error) {
    console.error("Add CP Student Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
};
