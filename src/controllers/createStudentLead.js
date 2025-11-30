// controllers/studentLeadController.js
import StudentLead from "../models/StudentLead.js";

export const createStudentLead = async (req, res) => {
  try {
    const franchiseId = req.user?.franchiseId;
    if (!franchiseId) {
      return res.status(400).json({ message: "Franchise ID missing in token" });
    }

    const {
      name,
      qualification,
      specification,
      course,
      notes,
      source,
      otherSource,
      contact,
      digitalMarketingPayment,
    } = req.body;

    // Basic required field validation
    if (!name || !qualification || !specification || !course || !source) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Additional validation for "Other" source
    if (source === "Other" && !otherSource?.trim()) {
      return res
        .status(400)
        .json({ message: "Please specify the 'Other' source" });
    }

    // Validate contact object
    if (!contact || !contact.phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Sanitize strings
    const sanitize = (v) =>
      typeof v === "string" ? v.trim().replace(/<[^>]*>?/gm, "") : v;

    const leadData = {
      franchiseId,
      name: sanitize(name),
      qualification: sanitize(qualification),
      specification: sanitize(specification),
      course: sanitize(course),
      notes: sanitize(notes),
      source: sanitize(source),
      otherSource: sanitize(otherSource),

      contact: {
        phone: sanitize(contact.phone),
        email: sanitize(contact.email),
      },
    };

    // If digital marketing data exists
    if (digitalMarketingPayment?.amount) {
      leadData.digitalMarketingPayment = {
        amount: Number(digitalMarketingPayment.amount),
        paidTo: sanitize(digitalMarketingPayment.paidTo),
        date:
          digitalMarketingPayment.date ||
          new Date().toISOString().split("T")[0],
      };
    }

    // const newLead = await StudentLead.create(leadData);
    await StudentLead.create(leadData);

    return res.status(201).json({
      message: "Lead created successfully",
      //   data: newLead,
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
