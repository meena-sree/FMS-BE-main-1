// controllers/franchiseController.js
import FranchiseLead from "../models/FranchiseLead.js";
import Client from "../models/Client.js";

export const getFranchiseLeadAndClient = async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const clientId = req.user.clientId;
    const { FranchiseLeadId } = req.params;
    console.log(
      FranchiseLeadId + " From the front end getDataFranchiseForm.js"
    );

    if (!managerId) {
      return res.status(400).json({ message: "managerId missing in user" });
    }
    if (!clientId) {
      return res.status(400).json({ message: "clientId missing in user" });
    }

    // 🔥 1️⃣ Fetch Franchise Lead (ONLY for that manager)
    const lead = await FranchiseLead.findOne({
      _id: FranchiseLeadId,
      managerId: managerId,
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found for this manager",
      });
    }

    // 🔥 2️⃣ Fetch Client (for finance data)
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      lead: {
        ownerName: lead.ownerName,
        ownerEmail: lead.ownerEmail,
        ownerPhone: lead.ownerPhone,
        fullAddress: lead.fullAddress,
      },
      clientFinance: client.franchiseFinance,
      institutionName: client.institutionName,
      institutionAddress: client.institutionAddress,
      institutionPhone: client.institutionPhone,
      logoUrl: client.logoUrl,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

export const calculateFranchiseAmounts = async (req, res) => {
  try {
    const {
      discountPercent = 0,
      nonRefundPercent = 0,
      baseTotal = 0,
    } = req.body;

    const base = Number(baseTotal);

    // 1️⃣ Calculate Discount
    const discount = Math.round((Number(discountPercent) / 100) * base);

    // 2️⃣ New Net Total
    const netTotal = base - discount;

    // 3️⃣ Calculate Non-Refundable Amount based on Net Total
    const nonRefundAmount = Math.round(
      (Number(nonRefundPercent) / 100) * netTotal
    );

    return res.status(200).json({
      success: true,
      data: {
        baseTotal: base,
        discountPercent: Number(discountPercent),
        discount,
        netTotal,
        nonRefundPercent: Number(nonRefundPercent),
        nonRefundAmount,
      },
    });
  } catch (error) {
    console.error("Calculate amounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Error calculating franchise amounts",
    });
  }
};
