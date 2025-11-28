import Contact from "../models/Contact.js";

export async function createContact(req, res) {
  try {
    const { name, email, message } = req.body;

    // basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    // optional: very small email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const contact = await Contact.create({ name, email, message });
    // optional: send email / webhook here

    return res.status(201).json({ success: true, data: contact });
  } catch (err) {
    console.error("createContact error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
