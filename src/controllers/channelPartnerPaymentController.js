import ChannelPartnerStudent from "../models/ChannelPartnerStudent.js";
import ChannelPartner from "../models/ChannelPartner.js";

export const addPaymentToChannelPartnerStudent = async (req, res) => {
  try {
    const managerId = req.user.managerId; // From auth middleware
    const receivedBy = req.user.name;
    const { studentId } = req.params;
    const { amount, mode } = req.body;

    // Validation
    if (!amount || !mode) {
      return res.status(400).json({
        message: "Amount and payment mode are required.",
        success: false,
      });
    }

    // Get student
    const student = await ChannelPartnerStudent.findOne({
      _id: studentId,
      managerId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found or not assigned to manager.",
        success: false,
      });
    }

    // Get Channel Partner
    const partner = await ChannelPartner.findOne({
      _id: student.channelPartnerId,
      managerId,
    });

    if (!partner) {
      return res.status(404).json({
        message: "Channel Partner not found.",
        success: false,
      });
    }

    // New payment object
    const paymentObj = {
      amount,
      mode,
      receivedBy: receivedBy || "Manager",
    };

    // Push to payments array
    student.payments.push(paymentObj);

    // Update total paid
    student.totalPaid += amount;

    // Save student
    await student.save();

    // 💰 Commission logic
    const commissionPercent = partner.commissionPercent / 100;
    const commissionEarned = amount * commissionPercent;

    // Update Channel Partner commission data
    partner.totalCommissionEarned += commissionEarned;
    partner.pendingCommission += commissionEarned;

    await partner.save();

    return res.status(200).json({
      message: "Payment added successfully.",
      //   success: true,
      //   data: {
      //     student,
      //     commissionAdded: commissionEarned,
      //   },
    });
  } catch (error) {
    console.error("Add Payment Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
};
