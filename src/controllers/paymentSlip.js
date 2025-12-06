// import PDFDocument from "pdfkit";
// import axios from "axios";
// import Student from "../models/Student.js";
// import Client from "../models/Client.js";
// import mongoose from "mongoose";

// export const downloadPaymentSlip = async (req, res) => {
//   try {
//     const { studentId, installmentNo } = req.params;
//     const installmentNumber = Number(installmentNo);

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid student ID" });
//     }

//     // Fetch student + related data
//     const student = await Student.findById(studentId)
//       .populate(
//         "ClientId",
//         "institutionName institutionAddress gst logoUrl institutionPhone"
//       )
//       .populate("FranchiseId", "name address phone")
//       .populate("ManagerId", "name email phone");

//     if (!student) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     const payment = student.payment?.[0];
//     if (!payment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Payment info missing" });
//     }

//     // Find that installment
//     const installment = payment.installments.find(
//       (i) => i.installmentNo === installmentNumber
//     );

//     if (!installment) {
//       return res.status(404).json({
//         success: false,
//         message: "Installment not found for this student",
//       });
//     }

//     // Find matching paidHistory entry (if exists)
//     const history = payment.paidHistory.find(
//       (h) => h.installmentNo === installmentNumber
//     );

//     // Logo loading
//     const fetchLogo = async (url) => {
//       if (!url) return null;
//       try {
//         const resp = await axios.get(url, { responseType: "arraybuffer" });
//         return Buffer.from(resp.data, "binary");
//       } catch {
//         return null;
//       }
//     };

//     const logoBuffer = await fetchLogo(student.ClientId?.logoUrl);

//     // Date formatter
//     const formatDate = (d) => {
//       if (!d) return "N/A";
//       return new Date(d).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
//     };

//     // Currency formatter
//     const inr = (n) =>
//       new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//         minimumFractionDigits: 2,
//       }).format(Number(n || 0));

//     // Create PDF
//     const doc = new PDFDocument({ size: "A4", margin: 30 });
//     const fileName = `payment-slip-STU${student._id
//       .toString()
//       .slice(-6)}-${installmentNumber}.pdf`;

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     doc.pipe(res);

//     const pageWidth = doc.page.width;
//     const leftX = doc.page.margins.left;
//     const rightX = pageWidth - doc.page.margins.right - 220;

//     // ---------- HEADER ----------
//     if (logoBuffer) {
//       doc.image(logoBuffer, leftX, doc.y, { fit: [70, 40] });
//     }

//     doc
//       .fontSize(18)
//       .font("Helvetica-Bold")
//       .text(student.ClientId?.institutionName || "Unlimited Learning Program", {
//         align: "center",
//       });

//     doc
//       .moveDown(0.2)
//       .fontSize(9)
//       .font("Helvetica")
//       .text(student.ClientId?.institutionAddress || "", { align: "center" });

//     doc
//       .moveDown(0.1)
//       .text(
//         `GST: ${student.ClientId?.gst || "N/A"} | Phone: ${
//           student.ClientId?.institutionPhone || "N/A"
//         }`,
//         { align: "center" }
//       );

//     doc
//       .moveDown(0.3)
//       .strokeColor("#000")
//       .lineWidth(0.6)
//       .moveTo(leftX, doc.y)
//       .lineTo(pageWidth - doc.page.margins.right, doc.y)
//       .stroke();

//     doc.moveDown(0.3);

//     // ---------- TITLE ----------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(15)
//       .text("PAYMENT RECEIPT", { align: "center" });

//     doc.moveDown(0.3);

//     // ---------- RECEIPT INFO ----------
//     doc
//       .fontSize(10)
//       .font("Helvetica")
//       .text(
//         `Receipt No: REC-${student._id
//           .toString()
//           .slice(-6)}-${installmentNumber}`,
//         leftX,
//         doc.y,
//         {
//           continued: true,
//         }
//       )
//       .text(`Date: ${formatDate(new Date())}`, { align: "right" });

//     doc.moveDown(0.5);

//     // ---------- STUDENT INFORMATION ----------
//     doc
//       .fontSize(12)
//       .font("Helvetica-Bold")
//       .text("STUDENT INFORMATION", { underline: true });

//     doc.moveDown(0.2);

//     const studentDetails = [
//       `Name: ${student.name}`,
//       `Student ID: STU${student._id.toString().slice(-6)}`,
//       `Phone: ${student.phone}`,
//       `Email: ${student.email}`,
//       `Enrollment Date: ${formatDate(student.createdAt)}`,
//     ];

//     doc
//       .fontSize(10)
//       .font("Helvetica")
//       .text(studentDetails.join("\n"), leftX, doc.y, {
//         lineGap: 3,
//         width: 250,
//       });

//     // ---------- COURSE BELOW STUDENT INFO ----------
//     const course = student.courses[0];

//     doc
//       .moveDown(0.3)
//       .fontSize(10)
//       .font("Helvetica-Bold")
//       .text(`Course: ${course?.name || "N/A"}`)
//       .font("Helvetica")
//       .text(`Course ID: ${course?.id || "N/A"}`)
//       .text(`Total Installments: ${payment.installments.length}`);

//     doc.moveDown(0.5);

//     // ---------- PAYMENT DETAILS (RIGHT SIDE) ----------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text("PAYMENT DETAILS", rightX, doc.y, { underline: true });

//     doc.moveDown(0.2);

//     const method = history?.method || "N/A";

//     const paymentDetails = [
//       `Installment: ${installment.installmentNo}`,
//       `Due Date: ${formatDate(installment.dueDate)}`,
//       `Payment Date: ${formatDate(history?.paidDate || installment.paidDate)}`,
//       `Payment Status: ${installment.status}`,
//       `Payment Method: ${method}`,
//       `Transaction ID: TXN-${Date.now().toString().slice(-8)}`,
//     ];

//     doc
//       .fontSize(10)
//       .font("Helvetica")
//       .text(paymentDetails.join("\n"), rightX, doc.y, {
//         width: 220,
//         lineGap: 3,
//       });

//     doc.moveDown(1);

//     // ---------- AMOUNT BREAKDOWN ----------
//     doc
//       .fontSize(12)
//       .font("Helvetica-Bold")
//       .text("AMOUNT BREAKDOWN", { underline: true });

//     doc.moveDown(0.3);

//     const table = [
//       ["Original Amount", inr(installment.originalAmount)],
//       ["Franchise Discount", `- ${inr(installment.franchiseDiscount)}`],
//       ["GST Amount", `+ ${inr(installment.gstAmount)}`],
//       ["Total Payable", inr(installment.totalPayable)],
//       ["Amount Paid", inr(history?.paidAmount || installment.paidAmount)],
//       [
//         "Balance Amount",
//         inr(
//           (installment.totalPayable || 0) -
//             (history?.paidAmount || installment.paidAmount || 0)
//         ),
//       ],
//     ];

//     table.forEach(([label, value]) => {
//       doc.font("Helvetica").fontSize(10).text(label, leftX, doc.y, {
//         continued: true,
//       });
//       doc.text(value, { align: "right" });
//       doc.moveDown(0.2);
//     });

//     doc.moveDown(1);

//     // ---------- PAYMENT SUMMARY ----------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text("PAYMENT SUMMARY", { underline: true });

//     doc.moveDown(0.3);

//     const totalPaid = payment.paidHistory.reduce((s, h) => s + h.paidAmount, 0);
//     const totalPending = payment.finalFee - totalPaid;

//     const summary = [
//       ["Total Paid So Far:", inr(totalPaid)],
//       ["Total Pending:", inr(totalPending)],
//       [
//         "Installments Paid:",
//         `${payment.paidHistory.length} / ${payment.installments.length}`,
//       ],
//       [
//         "Payment Progress:",
//         `${Math.round((totalPaid / payment.finalFee) * 100)}%`,
//       ],
//     ];

//     summary.forEach(([l, v]) => {
//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .text(l, leftX, doc.y, { continued: true });
//       doc.text(v, { align: "right" });
//       doc.moveDown(0.2);
//     });

//     doc.moveDown(1);

//     // ---------- FOOTER ----------
//     doc
//       .strokeColor("#000")
//       .moveTo(leftX, doc.y)
//       .lineTo(pageWidth - doc.page.margins.right, doc.y)
//       .stroke();

//     doc
//       .moveDown(0.3)
//       .fontSize(9)
//       .font("Helvetica-Oblique")
//       .text(
//         "This is a computer-generated receipt and does not require a signature.",
//         {
//           align: "center",
//         }
//       );

//     doc.end();
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "PDF generation failed",
//         error: err.message,
//       });
//   }
// };

// import PDFDocument from "pdfkit";
// import axios from "axios";
// import Student from "../models/Student.js";
// import Client from "../models/Client.js";
// import mongoose from "mongoose";

// export const downloadPaymentSlip = async (req, res) => {
//   try {
//     const { studentId, installmentNo } = req.params;
//     const installmentNumber = Number(installmentNo);

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid student ID",
//       });
//     }

//     // Fetch student data
//     const student = await Student.findById(studentId)
//       .populate(
//         "ClientId",
//         "institutionName institutionAddress gst logoUrl institutionPhone"
//       )
//       .populate("FranchiseId", "name address phone")
//       .populate("ManagerId", "name email phone");

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     const payment = student.payment?.[0];
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "No payment data found",
//       });
//     }

//     const installment = payment.installments.find(
//       (i) => i.installmentNo === installmentNumber
//     );

//     if (!installment) {
//       return res.status(404).json({
//         success: false,
//         message: "Installment not found",
//       });
//     }

//     const history = payment.paidHistory.find(
//       (h) => h.installmentNo === installmentNumber
//     );

//     // ---------- HELPERS ----------
//     const formatDate = (date) =>
//       date
//         ? new Date(date).toLocaleDateString("en-IN", {
//             day: "2-digit",
//             month: "short",
//             year: "numeric",
//           })
//         : "N/A";

//     const inr = (num) =>
//       new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//       }).format(Number(num || 0));

//     // Fetch logo
//     const fetchLogo = async (url) => {
//       if (!url) return null;
//       try {
//         const resp = await axios.get(url, { responseType: "arraybuffer" });
//         return Buffer.from(resp.data);
//       } catch {
//         return null;
//       }
//     };

//     const logo = await fetchLogo(student?.ClientId?.logoUrl);

//     // ---------- CREATE PDF ----------
//     const doc = new PDFDocument({ margin: 35, size: "A4" });

//     const fileName = `payment-slip-${studentId}-${installmentNumber}.pdf`;
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     doc.pipe(res);

//     const pageWidth = doc.page.width;
//     const leftX = 35;
//     const rightX = pageWidth - 250;

//     // ----------------------------------------------
//     // HEADER
//     // ----------------------------------------------
//     if (logo) doc.image(logo, leftX, doc.y, { fit: [70, 40] });

//     doc
//       .font("Helvetica-Bold")
//       .fontSize(18)
//       .text(student.ClientId?.institutionName || "Unlimited Learning Program", {
//         align: "center",
//       });

//     doc
//       .moveDown(0.15)
//       .fontSize(9)
//       .font("Helvetica")
//       .text(student.ClientId?.institutionAddress || "", { align: "center" });

//     doc
//       .moveDown(0.05)
//       .text(
//         `GST: ${student.ClientId?.gst || "N/A"} | Phone: ${
//           student.ClientId?.institutionPhone || "N/A"
//         }`,
//         { align: "center" }
//       );

//     doc
//       .moveDown(0.3)
//       .strokeColor("#000")
//       .lineWidth(0.6)
//       .moveTo(leftX, doc.y)
//       .lineTo(pageWidth - 35, doc.y)
//       .stroke();

//     doc.moveDown(0.5);

//     // ----------------------------------------------
//     // RECEIPT TITLE
//     // ----------------------------------------------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(15)
//       .text("PAYMENT RECEIPT", { align: "center" });

//     doc.moveDown(0.5);

//     // ----------------------------------------------
//     // META (LEFT / RIGHT)
//     // ----------------------------------------------
//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .text(
//         `Receipt No: REC-${student._id
//           .toString()
//           .slice(-6)}-${installmentNumber}`,
//         leftX,
//         doc.y,
//         { continued: true }
//       )
//       .text(`Date: ${formatDate(new Date())}`, { align: "right" });

//     doc.moveDown(0.5);

//     // ----------------------------------------------
//     // STUDENT INFO (LEFT COLUMN)
//     // ----------------------------------------------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text("STUDENT INFORMATION", leftX, doc.y, { underline: true });

//     doc.moveDown(0.2);

//     const studentStartY = doc.y; // save Y for right side alignment

//     const studentInfo = [
//       `Name: ${student.name}`,
//       `Student ID: STU${student._id.toString().slice(-6)}`,
//       `Phone: ${student.phone}`,
//       `Email: ${student.email}`,
//       `Enrollment Date: ${formatDate(student.createdAt)}`,
//     ];

//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .text(studentInfo.join("\n"), leftX, studentStartY, {
//         lineGap: 3,
//       });

//     const leftColumnBottom = doc.y;

//     // ----------------------------------------------
//     // PAYMENT DETAILS (RIGHT COLUMN) — PERFECT ALIGNMENT
//     // ----------------------------------------------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text("PAYMENT DETAILS", rightX, studentStartY, { underline: true });

//     const method = history?.method || "N/A";

//     doc
//       .moveDown(0.2)
//       .font("Helvetica")
//       .fontSize(10)
//       .text(
//         [
//           `Installment: ${installment.installmentNo}`,
//           `Due Date: ${formatDate(installment.dueDate)}`,
//           `Payment Date: ${formatDate(
//             history?.paidDate || installment.paidDate
//           )}`,
//           `Payment Status: ${installment.status}`,
//           `Payment Method: ${method}`,
//           `Transaction ID: TXN-${Date.now().toString().slice(-8)}`,
//         ].join("\n"),
//         rightX,
//         doc.y,
//         { width: 220, lineGap: 3 }
//       );

//     // Move cursor below student+right sections
//     doc.y = Math.max(leftColumnBottom, doc.y) + 20;

//     // ----------------------------------------------
//     // COURSE BELOW STUDENT INFO
//     // ----------------------------------------------
//     const course = student.courses?.[0];

//     doc
//       .font("Helvetica-Bold")
//       .fontSize(11)
//       .text(`Course: ${course?.name || "N/A"}`, leftX)
//       .font("Helvetica")
//       .text(`Course ID: ${course?.id || "N/A"}`, leftX)
//       .text(`Total Installments: ${payment.installments.length}`, leftX);

//     doc.moveDown(1);

//     // ----------------------------------------------
//     // AMOUNT BREAKDOWN
//     // ----------------------------------------------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text("AMOUNT BREAKDOWN", { underline: true });

//     doc.moveDown(0.4);

//     const amtRows = [
//       ["Original Amount", inr(installment.originalAmount)],
//       ["Franchise Discount", `- ${inr(installment.franchiseDiscount || 0)}`],
//       ["GST Amount", `+ ${inr(installment.gstAmount || 0)}`],
//       ["Total Payable", inr(installment.totalPayable)],
//       ["Amount Paid", inr(history?.paidAmount || installment.paidAmount)],
//       [
//         "Balance Amount",
//         inr(
//           installment.totalPayable -
//             (history?.paidAmount || installment.paidAmount)
//         ),
//       ],
//     ];

//     amtRows.forEach(([label, value]) => {
//       const y = doc.y;
//       doc.font("Helvetica").fontSize(10).text(label, leftX, y);
//       doc.text(value, rightX + 80, y, { align: "right" });
//       doc.moveDown(0.4);
//     });

//     doc.moveDown(1);

//     // ----------------------------------------------
//     // PAYMENT SUMMARY
//     // ----------------------------------------------
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text("PAYMENT SUMMARY", { underline: true });

//     doc.moveDown(0.3);

//     const totalPaid = payment.paidHistory.reduce((s, h) => s + h.paidAmount, 0);
//     const totalPending = payment.finalFee - totalPaid;

//     const summaryRows = [
//       ["Total Paid So Far:", inr(totalPaid)],
//       ["Total Pending:", inr(totalPending)],
//       [
//         "Installments Paid:",
//         `${payment.paidHistory.length} / ${payment.installments.length}`,
//       ],
//       [
//         "Payment Progress:",
//         `${Math.round((totalPaid / payment.finalFee) * 100)}%`,
//       ],
//     ];

//     summaryRows.forEach(([label, value]) => {
//       const y = doc.y;
//       doc.font("Helvetica").fontSize(10).text(label, leftX, y);
//       doc.text(value, rightX + 80, y, { align: "right" });
//       doc.moveDown(0.4);
//     });

//     doc.moveDown(1);

//     // ----------------------------------------------
//     // FOOTER
//     // ----------------------------------------------
//     doc
//       .strokeColor("#000")
//       .lineWidth(0.5)
//       .moveTo(leftX, doc.y)
//       .lineTo(pageWidth - 35, doc.y)
//       .stroke();

//     doc
//       .moveDown(0.3)
//       .font("Helvetica-Oblique")
//       .fontSize(9)
//       .text(
//         "This is a computer-generated receipt and does not require a signature.",
//         { align: "center" }
//       );

//     doc.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "PDF generation failed",
//       error: err.message,
//     });
//   }
// };

// import PdfPrinter from "pdfmake";
// import axios from "axios";

// const fonts = {
//   Roboto: {
//     normal: "node_modules/pdfmake/fonts/Roboto-Regular.ttf",
//     bold: "node_modules/pdfmake/fonts/Roboto-Medium.ttf",
//   },
// };

// const printer = new PdfPrinter(fonts);

// export const generatePaymentSlip = async (req, res) => {
//   try {
//     const { transactionId } = req.params;

//     // Fetch transaction, student, franchise data
//     const transaction = await Transaction.findById(transactionId);
//     const student = await Student.findById(transaction.studentId);
//     const franchise = await Franchise.findById(student.franchiseId);

//     // Fetch logo from URL as base64
//     let logoBase64 = null;
//     if (franchise.logoUrl) {
//       const response = await axios.get(franchise.logoUrl, {
//         responseType: "arraybuffer",
//       });
//       logoBase64 = `data:image/png;base64,${Buffer.from(response.data).toString(
//         "base64"
//       )}`;
//     }

//     // PDF contents
//     const docDefinition = {
//       content: [
//         {
//           columns: [
//             logoBase64
//               ? { image: logoBase64, width: 70 }
//               : { text: franchise.institutionName, bold: true, fontSize: 18 },
//             {
//               text: "PAYMENT SLIP",
//               alignment: "right",
//               bold: true,
//               fontSize: 16,
//             },
//           ],
//         },

//         { text: "\n" },

//         {
//           text: `Receipt No: ${transaction._id}`,
//           fontSize: 11,
//         },
//         {
//           text: `Date: ${transaction.date.toLocaleDateString()}`,
//           fontSize: 11,
//         },

//         { text: "\nStudent Details", style: "section" },
//         {
//           table: {
//             widths: ["auto", "*"],
//             body: [
//               ["Name:", student.name],
//               ["Course:", student.course],
//               ["Phone:", student.contact.phone],
//             ],
//           },
//         },

//         { text: "\nPayment Details", style: "section" },
//         {
//           table: {
//             widths: ["auto", "*"],
//             body: [
//               ["Amount Paid:", `₹${transaction.amount.toLocaleString()}`],
//               ["Method:", transaction.method],
//               ["Status:", transaction.status],
//             ],
//           },
//         },

//         { text: "\n\nThank You!", alignment: "center", italics: true },
//       ],

//       styles: {
//         section: { bold: true, fontSize: 13, margin: [0, 10, 0, 5] },
//       },
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDefinition);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename=payment-slip-${transactionId}.pdf`
//     );

//     pdfDoc.pipe(res);
//     pdfDoc.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error generating payment slip" });
//   }
// };

// controllers/paymentSlipController.js
// import Student from "../models/Student.js";
// import Client from "../models/Client.js";
// import mongoose from "mongoose";

// export const generatePaymentSlip = async (req, res) => {
//   try {
//     const { studentId, installmentNo } = req.params;
//     const { paymentDate, paymentMethod, notes } = req.body;

//     // Validate inputs
//     if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid student ID is required",
//       });
//     }

//     if (!installmentNo || isNaN(installmentNo)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid installment number is required",
//       });
//     }

//     // Find student with all details
//     const student = await Student.findById(studentId)
//       .populate("ClientId", "institutionName institutionAddress gst logoUrl")
//       .populate("FranchiseId", "name address phone")
//       .populate("ManagerId", "name email phone");

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     // Get the payment (assuming first payment)
//     const payment = student.payment[0];
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "No payment information found",
//       });
//     }

//     // Find the specific installment
//     const installment = payment.installments.find(
//       (inst) => inst.installmentNo === parseInt(installmentNo)
//     );

//     if (!installment) {
//       return res.status(404).json({
//         success: false,
//         message: "Installment not found",
//       });
//     }

//     // Get client details
//     const client =
//       student.ClientId || (await Client.findById(student.ClientId));

//     // Calculate payment summary
//     const paidHistory = payment.paidHistory || [];
//     const totalPaid = paidHistory.reduce(
//       (sum, history) => sum + history.paidAmount,
//       0
//     );
//     const totalPending = payment.finalFee - totalPaid;

//     // Generate receipt number
//     const receiptNumber = `REC-${student._id.toString().slice(-6)}-${Date.now()
//       .toString()
//       .slice(-4)}`;

//     // Format dates
//     const formatDate = (date) => {
//       if (!date) return "N/A";
//       return new Date(date).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
//     };

//     // Format currency
//     const formatCurrency = (amount) => {
//       return new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//         minimumFractionDigits: 2,
//       }).format(amount);
//     };

//     // Create payment slip object
//     const paymentSlip = {
//       // Header Information
//       header: {
//         institutionName:
//           client?.institutionName || "Unlimited Learning Program",
//         institutionAddress:
//           client?.institutionAddress ||
//           "#123 SVA Archade, 2nd floor 70th cross, 5th block Rajajinagar, Bengaluru, Karnataka - 560072",
//         logoUrl: client?.logoUrl || "https://uplguru.com/assets/logo3.png",
//         gstNumber: client?.gst || "AAA123456789",
//         phone: client?.institutionPhone || "1223456789",
//         documentTitle: "PAYMENT RECEIPT",
//         receiptNumber: receiptNumber,
//         issueDate: formatDate(new Date()),
//       },

//       // Student Information
//       student: {
//         name: student.name,
//         studentId: student._id.toString().slice(-8),
//         phone: student.phone,
//         email: student.email,
//         qualification: student.qualification,
//         yearOfPassout: student.yearOfPassout,
//         address: `${student.address.street}, ${student.address.area}, ${student.address.city}, ${student.address.state} - ${student.address.zip}`,
//         enrollmentDate: formatDate(student.createdAt),
//       },

//       // Course Information
//       course: {
//         name: student.courses[0]?.name || "N/A",
//         courseId: student.courses[0]?.id || "N/A",
//         totalFee: payment.totalFee,
//         discount: payment.discount,
//         gst: payment.gst,
//         finalFee: payment.finalFee,
//         totalInstallments: payment.installments.length,
//       },

//       // Payment Details
//       payment: {
//         installmentNumber: installment.installmentNo,
//         dueDate: formatDate(installment.dueDate),
//         paymentDate: paymentDate
//           ? formatDate(paymentDate)
//           : formatDate(new Date()),
//         paymentMethod: paymentMethod || "Not Specified",

//         // Amount Breakdown
//         amounts: {
//           originalAmount: installment.originalAmount,
//           franchiseDiscount: installment.franchiseDiscount,
//           gstAmount: installment.gstAmount,
//           totalPayable: installment.totalPayable,
//           paidAmount: installment.paidAmount || installment.totalPayable,
//           balanceAmount: Math.max(
//             0,
//             installment.totalPayable - (installment.paidAmount || 0)
//           ),
//         },

//         // Formatted amounts for display
//         formattedAmounts: {
//           originalAmount: formatCurrency(installment.originalAmount),
//           franchiseDiscount: formatCurrency(installment.franchiseDiscount),
//           gstAmount: formatCurrency(installment.gstAmount),
//           totalPayable: formatCurrency(installment.totalPayable),
//           paidAmount: formatCurrency(
//             installment.paidAmount || installment.totalPayable
//           ),
//           balanceAmount: formatCurrency(
//             Math.max(
//               0,
//               installment.totalPayable - (installment.paidAmount || 0)
//             )
//           ),
//         },

//         status: installment.status,
//         transactionId: `TXN-${Date.now().toString().slice(-8)}`,
//         notes: notes || installment.notes || "",
//       },

//       // Summary Information
//       summary: {
//         totalFee: formatCurrency(payment.totalFee),
//         totalDiscount: formatCurrency(payment.discount),
//         totalGST: formatCurrency(payment.gst),
//         finalFee: formatCurrency(payment.finalFee),
//         totalPaidSoFar: formatCurrency(
//           totalPaid + (installment.paidAmount || installment.totalPayable)
//         ),
//         totalPending: formatCurrency(
//           totalPending - (installment.paidAmount || installment.totalPayable)
//         ),
//         installmentsPaid: paidHistory.length + 1,
//         totalInstallments: payment.installments.length,
//         progressPercentage: Math.round(
//           ((totalPaid + (installment.paidAmount || installment.totalPayable)) /
//             payment.finalFee) *
//             100
//         ),
//       },

//       // Footer Information
//       footer: {
//         terms:
//           "This is a computer-generated receipt and does not require a physical signature.",
//         authorizedBy: student.ManagerId?.name || "System Administrator",
//         contactEmail: student.ManagerId?.email || "support@uplguru.com",
//         contactPhone: student.ManagerId?.phone || "1223456789",
//         generatedAt: new Date().toISOString(),
//         franchiseInfo: student.FranchiseId
//           ? {
//               name: student.FranchiseId.name,
//               address: student.FranchiseId.address,
//               phone: student.FranchiseId.phone,
//             }
//           : null,
//       },
//     };

//     res.status(200).json({
//       success: true,
//       message: "Payment slip generated successfully",
//       data: paymentSlip,
//       downloadUrl: `/api/payment-slips/download/${studentId}/${installmentNo}`, // Optional: For PDF download
//       printData: paymentSlip, // For front-end printing
//     });
//   } catch (error) {
//     console.error("Error generating payment slip:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// Additional endpoint for PDF download
// export const downloadPaymentSlip = async (req, res) => {
//   try {
//     const { studentId, installmentNo } = req.params;

//     // Generate PDF logic would go here
//     // You can use libraries like pdfkit, puppeteer, or html-pdf

//     res.status(200).json({
//       success: true,
//       message: "PDF download endpoint",
//       // Return PDF buffer or URL
//     });
//   } catch (error) {
//     console.error("Error downloading payment slip:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error generating PDF",
//       error: error.message,
//     });
//   }
// };
// =================================================================
// controllers/pdfController.js
// import PDFDocument from "pdfkit";
// import fs from "fs";
// import path from "path";
// import Student from "../models/Student.js";
// import Client from "../models/Client.js";
// import mongoose from "mongoose";

// export const downloadPaymentSlip = async (req, res) => {
//   try {
//     const { studentId, installmentNo } = req.params;

//     // Validate inputs
//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid student ID",
//       });
//     }

//     if (!installmentNo || isNaN(installmentNo)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid installment number is required",
//       });
//     }

//     // Fetch student data with related information
//     const student = await Student.findById(studentId)
//       .populate(
//         "ClientId",
//         "institutionName institutionAddress gst logoUrl institutionPhone"
//       )
//       .populate("FranchiseId", "name address phone")
//       .populate("ManagerId", "name email phone");

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     // Get the payment and installment
//     const payment = student.payment[0];
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "No payment information found",
//       });
//     }

//     const installment = payment.installments.find(
//       (inst) => inst.installmentNo === parseInt(installmentNo)
//     );
//     // console.log(installment);
//     // console.log(student);

//     if (!installment) {
//       return res.status(404).json({
//         success: false,
//         message: "Installment not found",
//       });
//     }

//     // Get client details
//     const client =
//       student.ClientId || (await Client.findById(student.ClientId));

//     // Calculate totals
//     const paidHistory = payment.paidHistory || [];
//     const totalPaid = paidHistory.reduce(
//       (sum, history) => sum + history.paidAmount,
//       0
//     );
//     const totalPending = payment.finalFee - totalPaid;

//     // Generate receipt number
//     const receiptNumber = `REC-${student._id.toString().slice(-6)}-${Date.now()
//       .toString()
//       .slice(-4)}`;

//     // Create PDF document
//     const doc = new PDFDocument({
//       size: "A4",
//       margin: 50,
//       bufferPages: true,
//     });

//     // Set response headers for PDF
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=payment-slip-${receiptNumber}.pdf`
//     );

//     // Pipe PDF to response
//     doc.pipe(res);

//     // ==================== PDF CONTENT STARTS HERE ====================

//     // Helper function to format dates
//     const formatDate = (date) => {
//       if (!date) return "N/A";
//       const d = new Date(date);
//       return d.toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
//     };

//     // Helper function to format currency
//     const formatCurrency = (amount) => {
//       return new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//         minimumFractionDigits: 2,
//       }).format(amount);
//     };

//     // ============ HEADER SECTION ============
//     // Institution Name (Centered, Large Font)
//     doc
//       .fontSize(24)
//       .font("Helvetica-Bold")
//       .fillColor("#000000")
//       .text(client?.institutionName || "Unlimited Learning Program", {
//         align: "center",
//       });

//     // Institution Address
//     doc
//       .fontSize(10)
//       .font("Helvetica")
//       .text(
//         client?.institutionAddress ||
//           "#123 SVA Archade, 2nd floor 70th cross, 5th block Rajajinagar, Bengaluru, Karnataka - 560072",
//         {
//           align: "center",
//           lineGap: 2,
//         }
//       );

//     // GST and Phone
//     doc
//       .fontSize(10)
//       .text(
//         `GST: ${client?.gst || "AAA123456789"} | Phone: ${
//           client?.institutionPhone || "1223456789"
//         }`,
//         {
//           align: "center",
//         }
//       );

//     // Separator line
//     doc
//       .moveDown(0.5)
//       .strokeColor("#000000")
//       .lineWidth(1)
//       .moveTo(50, doc.y)
//       .lineTo(550, doc.y)
//       .stroke();

//     // ============ RECEIPT TITLE ============
//     doc
//       .moveDown(1)
//       .fontSize(20)
//       .font("Helvetica-Bold")
//       .text("PAYMENT RECEIPT", {
//         align: "center",
//       });

//     // Receipt Number and Date
//     doc
//       .moveDown(0.5)
//       .fontSize(12)
//       .font("Helvetica")
//       .text(`Receipt No: ${receiptNumber}`, {
//         align: "center",
//       })
//       .text(`Date: ${formatDate(new Date())}`, {
//         align: "center",
//       });

//     // Separator line
//     doc
//       .moveDown(0.5)
//       .strokeColor("#000000")
//       .lineWidth(0.5)
//       .moveTo(50, doc.y)
//       .lineTo(550, doc.y)
//       .stroke();

//     doc.moveDown(1);

//     // ============ STUDENT INFORMATION ============
//     doc.fontSize(14).font("Helvetica-Bold").text("STUDENT INFORMATION", {
//       underline: true,
//     });

//     doc.moveDown(0.5);

//     // Student details in two columns
//     const studentCol1 = [
//       `Name: ${student.name}`,
//       `Student ID: STU${student._id.toString().slice(-6)}`,
//       `Phone: ${student.phone}`,
//       `Email: ${student.email}`,
//       `Enrollment Date: ${formatDate(student.createdAt)}`,
//     ];

//     // const studentCol2 = [
//     //   `Qualification: ${student.qualification}`,
//     //   `Year of Passout: ${student.yearOfPassout}`,
//     //
//     //   `Address: ${student.address.city}, ${student.address.state}`,
//     // ];

//     doc.fontSize(10).font("Helvetica").text(studentCol1.join("\n"), 50, doc.y, {
//       width: 250,
//       lineGap: 5,
//     });

//     // doc.text(studentCol2.join("\n"), 350, doc.y - studentCol1.length * 15, {
//     //   width: 200,
//     //   lineGap: 5,
//     // });

//     doc.moveDown(studentCol1.length * 0.3);

//     // ============ COURSE DETAILS ============
//     doc.fontSize(14).font("Helvetica-Bold").text("COURSE DETAILS", {
//       underline: true,
//     });

//     doc.moveDown(0.5);

//     const courseCol1 = [
//       `Course: ${student.courses[0]?.name || "N/A"}`,
//       `Course ID: ${student.courses[0]?.id || "N/A"}`,
//       `Total Installments: ${payment.installments.length}`,
//     ];

//     const courseCol2 = [
//       `Total Fee: ${formatCurrency(payment.totalFee)}`,
//       `Discount: ${formatCurrency(payment.discount)}`,
//       `GST: ${formatCurrency(payment.gst)}`,
//       `Final Fee: ${formatCurrency(payment.finalFee)}`,
//     ];

//     doc.fontSize(10).font("Helvetica").text(courseCol1.join("\n"), 50, doc.y, {
//       width: 250,
//       lineGap: 5,
//     });

//     doc.text(courseCol2.join("\n"), 350, doc.y - courseCol1.length * 15, {
//       width: 200,
//       lineGap: 5,
//     });

//     doc.moveDown(courseCol1.length * 0.3);

//     // ============ PAYMENT DETAILS ============
//     doc.fontSize(14).font("Helvetica-Bold").text("PAYMENT DETAILS", {
//       underline: true,
//     });

//     doc.moveDown(0.5);

//     const paymentDetails = [
//       `Installment Number: ${installment.installmentNo}`,
//       `Due Date: ${formatDate(installment.dueDate)}`,
//       `Payment Date: ${formatDate(new Date())}`,
//       `Payment Status: ${installment.status === "paid" ? "Paid" : "Pending"}`,
//       //   `Payment Method: ${
//       //     student.payment[0].paidHistory[installment.installmentNo].method
//       //   }`,
//       `Transaction ID: TXN-${Date.now().toString().slice(-8)}`,
//     ];

//     doc.fontSize(10).font("Helvetica").text(paymentDetails.join("\n"), {
//       lineGap: 5,
//     });

//     doc.moveDown(1);

//     // ============ AMOUNT BREAKDOWN TABLE ============
//     // doc.fontSize(14).font("Helvetica-Bold").text("AMOUNT BREAKDOWN", {
//     //   underline: true,
//     // });

//     // doc.moveDown(0.5);

//     // // Table headers
//     // const tableTop = doc.y;
//     // const itemCol = 50;
//     // const amountCol = 450;

//     // doc
//     //   .fontSize(11)
//     //   .font("Helvetica-Bold")
//     //   .text("Description", itemCol, tableTop)
//     //   .text("Amount", amountCol, tableTop);

//     // // Separator line for header
//     // doc
//     //   .moveTo(itemCol, tableTop + 15)
//     //   .lineTo(550, tableTop + 15)
//     //   .lineWidth(0.5)
//     //   .stroke();

//     // let currentY = tableTop + 25;

//     // // Table rows
//     // const rows = [
//     //   {
//     //     description: "Original Amount",
//     //     amount: formatCurrency(installment.originalAmount),
//     //   },
//     //   {
//     //     description: "Franchise Discount",
//     //     amount: `- ${formatCurrency(installment.franchiseDiscount)}`,
//     //   },
//     //   {
//     //     description: "GST Amount",
//     //     amount: `+ ${formatCurrency(installment.gstAmount)}`,
//     //   },
//     //   {
//     //     description: "Total Payable",
//     //     amount: formatCurrency(installment.totalPayable),
//     //     isBold: true,
//     //   },
//     //   {
//     //     description: "Amount Paid",
//     //     amount: formatCurrency(
//     //       installment.paidAmount || installment.totalPayable
//     //     ),
//     //   },
//     //   {
//     //     description: "Balance Amount",
//     //     amount: formatCurrency(
//     //       Math.max(0, installment.totalPayable - (installment.paidAmount || 0))
//     //     ),
//     //   },
//     // ];

//     // rows.forEach((row, index) => {
//     //   if (row.isBold) {
//     //     doc.font("Helvetica-Bold");
//     //   } else {
//     //     doc.font("Helvetica");
//     //   }

//     //   doc
//     //     .fontSize(10)
//     //     .text(row.description, itemCol, currentY)
//     //     .text(row.amount, amountCol, currentY, { align: "right" });

//     //   // Add separator line for total row
//     //   if (row.isBold) {
//     //     doc
//     //       .moveTo(itemCol, currentY + 15)
//     //       .lineTo(550, currentY + 15)
//     //       .lineWidth(0.5)
//     //       .stroke();
//     //     currentY += 20;
//     //   } else {
//     //     currentY += 15;
//     //   }
//     // });

//     // doc.y = currentY + 10;

//     // ================= AMOUNT BREAKDOWN (CLEAN + ALIGNED) =================

//     doc.fontSize(14).font("Helvetica-Bold").text("AMOUNT BREAKDOWN", {
//       underline: true,
//     });
//     doc.moveDown(0.8);

//     const leftX = 50;
//     const rightX = 450;

//     // calculate gst% and gst amount per installment
//     const gstPercent = (
//       (payment.gst / (payment.finalFee - payment.gst)) *
//       100
//     ).toFixed(0); // usually 18%
//     const gstPerInstallment = payment.gst / payment.installments.length;

//     // description + amount rows (clean)
//     const rows = [
//       {
//         label: `Installment Amount`,
//         value: formatCurrency(installment.originalAmount),
//       },
//       {
//         label: `GST (${gstPercent}%)`,
//         value: formatCurrency(gstPerInstallment),
//       },
//       {
//         label: `Total Payable`,
//         value: formatCurrency(installment.originalAmount + gstPerInstallment),
//         bold: true,
//       },
//       {
//         label: "Amount Paid",
//         value: formatCurrency(installment.paidAmount),
//       },
//       {
//         label: "Balance Amount",
//         value: formatCurrency(
//           Math.max(
//             0,
//             installment.originalAmount +
//               gstPerInstallment -
//               (installment.paidAmount || 0)
//           )
//         ),
//       },
//     ];

//     // header
//     doc.font("Helvetica-Bold").fontSize(11);
//     doc.text("Description", leftX, doc.y);
//     doc.text("Amount", rightX, doc.y, { align: "right" });

//     doc.moveDown(0.3);

//     // header line
//     doc.moveTo(leftX, doc.y).lineTo(550, doc.y).lineWidth(0.5).stroke();

//     doc.moveDown(0.5);

//     // table rows
//     rows.forEach((row) => {
//       doc.font(row.bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);

//       const y = doc.y;
//       doc.text(row.label, leftX, y);
//       doc.text(row.value, rightX, y, { align: "right" });

//       doc.moveDown(0.6);

//       // underline total row
//       if (row.bold) {
//         doc.moveTo(leftX, doc.y).lineTo(550, doc.y).lineWidth(0.5).stroke();
//         doc.moveDown(0.4);
//       }
//     });

//     // ============ PAYMENT SUMMARY ============
//     doc.fontSize(14).font("Helvetica-Bold").text("PAYMENT SUMMARY", {
//       underline: true,
//     });

//     doc.moveDown(0.5);

//     const summaryData = [
//       {
//         label: "Total Paid So Far:",
//         value: formatCurrency(
//           totalPaid + (installment.paidAmount || installment.totalPayable)
//         ),
//       },
//       {
//         label: "Total Pending:",
//         value: formatCurrency(
//           totalPending - (installment.paidAmount || installment.totalPayable)
//         ),
//       },
//       {
//         label: "Installments Paid:",
//         value: `${paidHistory.length + 1} / ${payment.installments.length}`,
//       },
//       {
//         label: "Payment Progress:",
//         value: `${Math.round(
//           ((totalPaid + (installment.paidAmount || installment.totalPayable)) /
//             payment.finalFee) *
//             100
//         )}%`,
//       },
//     ];

//     doc.fontSize(10).font("Helvetica");

//     summaryData.forEach((item, index) => {
//       const yPos = doc.y;
//       doc
//         .text(item.label, 50, yPos, { continued: true })
//         .font("Helvetica-Bold")
//         .text(` ${item.value}`, { align: "right" })
//         .font("Helvetica");
//       doc.moveDown(0.3);
//     });

//     doc.moveDown(1);

//     // ============ FOOTER SECTION ============
//     // Separator line
//     doc
//       .strokeColor("#000000")
//       .lineWidth(0.5)
//       .moveTo(50, doc.y)
//       .lineTo(550, doc.y)
//       .stroke();

//     doc.moveDown(0.5);

//     // Terms and conditions
//     doc
//       .fontSize(9)
//       .font("Helvetica-Oblique")
//       .text(
//         "This is a computer-generated receipt and does not require a physical signature.",
//         {
//           align: "center",
//         }
//       );

//     doc.moveDown(0.5);

//     // Signature section
//     const signatureY = doc.y;

//     // Left side - Authorized by
//     doc
//       .fontSize(10)
//       .font("Helvetica")
//       .text("Authorized By:", 50, signatureY)
//       .font("Helvetica-Bold")
//       .text(
//         student.ManagerId?.name || "System Administrator",
//         50,
//         signatureY + 15
//       )
//       .font("Helvetica")
//       .text(
//         `Contact: ${student.ManagerId?.phone || "1223456789"}`,
//         50,
//         signatureY + 30
//       )
//       .text(
//         `Email: ${student.ManagerId?.email || "support@uplguru.com"}`,
//         50,
//         signatureY + 45
//       );

//     // Right side - Signature box
//     const signatureBoxX = 400;
//     doc.rect(signatureBoxX, signatureY, 150, 80).stroke();

//     doc
//       .fontSize(10)
//       .font("Helvetica")
//       .text("Authorized Signature", signatureBoxX + 40, signatureY + 30);

//     // Horizontal line for signature
//     doc
//       .moveTo(signatureBoxX + 20, signatureY + 60)
//       .lineTo(signatureBoxX + 130, signatureY + 60)
//       .stroke();

//     doc.moveDown(4);

//     // Generated timestamp
//     doc
//       .fontSize(8)
//       .font("Helvetica-Oblique")
//       .text(
//         `Generated on: ${new Date().toLocaleString("en-IN", {
//           dateStyle: "medium",
//           timeStyle: "medium",
//         })}`,
//         {
//           align: "center",
//         }
//       );

//     // ============ PAGE NUMBER ============
//     const pages = doc.bufferedPageRange();
//     for (let i = 0; i < pages.count; i++) {
//       doc.switchToPage(i);

//       // Add page number at bottom
//       doc
//         .fontSize(8)
//         .font("Helvetica")
//         .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, {
//           align: "center",
//           width: 500,
//         });
//     }

//     // Finalize PDF
//     doc.end();
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error generating PDF",
//       error: error.message,
//     });
//   }
// };
// ===================================================================================
// Optional: Generate HTML for preview (if you want to show preview before download)
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Client from "../models/Client.js";
import fs from "fs";

export const downloadPaymentSlip = async (req, res) => {
  let doc;

  try {
    const { studentId, installmentNo } = req.params;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    if (!installmentNo || isNaN(installmentNo)) {
      return res.status(400).json({
        success: false,
        message: "Valid installment number is required",
      });
    }

    // Fetch student data with client information
    const student = await Student.findById(studentId)
      .populate(
        "ClientId",
        "institutionName institutionAddress gst logoUrl institutionPhone"
      )
      .populate("ManagerId", "name email phone");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get the payment (first payment)
    const payment = student.payment[0];
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No payment information found",
      });
    }

    // Find the specific installment
    const installment = payment.installments.find(
      (inst) => inst.installmentNo === parseInt(installmentNo)
    );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: "Installment not found",
      });
    }

    // Get client details (if not populated)
    const client =
      student.ClientId || (await Client.findById(student.ClientId));

    // Find payment history for this installment
    const paymentHistory = payment.paidHistory.find(
      (history) => history.installmentNo === parseInt(installmentNo)
    );

    // Calculate totals
    const totalPaid = payment.paidHistory.reduce(
      (sum, history) => sum + history.paidAmount,
      0
    );
    const totalPending = payment.finalFee - totalPaid;
    const installmentsPaid = payment.installments.filter(
      (inst) => inst.status === "paid"
    ).length;
    const progressPercentage = Math.round((totalPaid / payment.finalFee) * 100);

    // Generate receipt number
    const receiptNumber = `REC${student._id.toString().slice(-6)}${installmentNo
      .toString()
      .padStart(3, "0")}${Date.now().toString().slice(-4)}`;

    // Create PDF document
    doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `Payment Receipt - ${receiptNumber}`,
        Author: client?.institutionName || "Unlimited Learning Program",
        Subject: "Payment Receipt",
        Keywords: "receipt, payment, invoice",
        Creator: "Payment Management System",
        CreationDate: new Date(),
      },
    });

    // Try to register custom fonts, fallback to Helvetica if not found
    try {
      const regularFontPath = path.join(
        __dirname,
        "../../assets/fonts/Noto_Sans/static/NotoSans_Condensed-Regular.ttf"
      );
      const boldFontPath = path.join(
        __dirname,
        "../../assets/fonts/Noto_Sans/static/NotoSans_Condensed-Bold.ttf"
      );

      if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
        doc.registerFont("Noto", regularFontPath);
        doc.registerFont("Noto-Bold", boldFontPath);
        console.log("Custom fonts registered successfully");
      } else {
        throw new Error("Font files not found, using Helvetica");
      }
    } catch (fontError) {
      console.warn("Using default Helvetica fonts:", fontError.message);
      // Use default Helvetica fonts
    }

    // Set response headers BEFORE piping
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Payment-Receipt-${receiptNumber}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ==================== HELPER FUNCTIONS ====================
    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatCurrency = (amount) => {
      return `₹${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    const drawSeparator = (yPos, startX = 40, endX = 555) => {
      doc
        .strokeColor("#000000")
        .lineWidth(0.5)
        .moveTo(startX, yPos)
        .lineTo(endX, yPos)
        .stroke();
    };

    // const addSectionHeader = (text, yPos) => {
    //   doc
    //     .fontSize(12)
    //     .font(doc._font ? "Noto-Bold" : "Helvetica-Bold")
    //     .fillColor("#000000")
    //     .text(text, 40, yPos);

    //   drawSeparator(yPos + 5);
    //   return yPos + 20;
    // };
    const addSectionHeader = (text, yPos) => {
      // Print the header text
      doc
        .fontSize(12)
        .font(doc._font ? "Noto-Bold" : "Helvetica-Bold")
        .fillColor("#000000")
        .text(text, 40, yPos);

      // Gap between text and line
      const separatorY = doc.y + 8; // SAFE spacing

      // Draw separator
      // drawSeparator(separatorY, 150, 445);
      drawSeparator(separatorY);

      // Return Y a bit below the separator
      return separatorY + 15;
    };

    const addTwoColumn = (
      leftText,
      rightText,
      yPos,
      leftBold = false,
      rightBold = false
    ) => {
      // Determine font family based on availability
      const fontFamily = doc._font ? "Noto" : "Helvetica";
      const fontFamilyBold = doc._font ? "Noto-Bold" : "Helvetica-Bold";

      // Left column
      doc
        .font(leftBold ? fontFamilyBold : fontFamily)
        .fontSize(10)
        .text(leftText, 40, yPos);

      // Right column
      const rightFont = rightBold ? fontFamilyBold : fontFamily;
      doc.font(rightFont);
      const textWidth = doc.widthOfString(rightText);
      doc.text(rightText, 555 - textWidth, yPos);

      return yPos + 15;
    };

    const addAmountRow = (label, amount, yPos, isTotal = false) => {
      const fontFamily = doc._font ? "Noto" : "Helvetica";
      const fontFamilyBold = doc._font ? "Noto-Bold" : "Helvetica-Bold";

      doc
        .font(isTotal ? fontFamilyBold : fontFamily)
        .fontSize(10)
        .text(label, 40, yPos);

      const amountText = formatCurrency(amount);
      const textWidth = doc.widthOfString(amountText);
      doc.text(amountText, 555 - textWidth, yPos);

      return yPos + 15;
    };

    // ==================== HEADER SECTION ====================
    let currentY = 40;

    // Institution Name
    doc
      .fontSize(18)
      .font(doc._font ? "Noto-Bold" : "Helvetica-Bold")
      .fillColor("#000000")
      .text(client?.institutionName || "Unlimited Learning Program", {
        align: "center",
      });

    // Institution Address
    doc
      .fontSize(10)
      .font(doc._font ? "Noto" : "Helvetica")
      .text(
        client?.institutionAddress ||
          "#123 SVA Archade, 2nd floor 70th cross, 5th block Rajajinagar, Bengaluru, Karnataka - 560072",
        {
          align: "center",
          lineGap: 2,
        }
      );

    // Contact Info
    doc
      .fontSize(9)
      .font(doc._font ? "Noto" : "Helvetica")
      .text(
        `GST: ${client?.gst || "AAA123456789"} | Phone: ${
          client?.institutionPhone || "1223456789"
        }`,
        {
          align: "center",
        }
      );

    currentY = doc.y + 3;
    drawSeparator(currentY);
    currentY += 15;

    // ==================== RECEIPT HEADER ====================
    doc
      .fontSize(16)
      .font(doc._font ? "Noto-Bold" : "Helvetica-Bold")
      .fillColor("#000000")
      .text("PAYMENT RECEIPT", {
        align: "center",
      });

    currentY = doc.y + 7;

    // Receipt Number and Date in two columns
    currentY = addTwoColumn(
      `Receipt No: ${receiptNumber}`,
      `Date: ${formatDate(new Date())}`,
      currentY,
      true,
      true
    );

    // currentY += 10;
    // drawSeparator(currentY, 150, 445);
    // currentY += 15;

    // ==================== STUDENT INFORMATION ====================
    currentY = addSectionHeader("STUDENT INFORMATION", currentY);

    currentY = addTwoColumn(
      `Name: ${student.name}`,
      `Student ID: STU${student._id.toString().slice(-8)}`,
      currentY
    );
    currentY = addTwoColumn(
      `Phone: ${student.phone}`,
      `Email: ${student.email}`,
      currentY
    );
    currentY = addTwoColumn(
      `Qualification: ${student.qualification}`,
      `Year of Passout: ${student.yearOfPassout}`,
      currentY
    );
    currentY = addTwoColumn(
      `Address: ${student.address.city}, ${student.address.state}`,
      `Enrollment: ${formatDate(student.createdAt)}`,
      currentY
    );

    currentY += 15;

    // ==================== COURSE DETAILS ====================
    currentY = addSectionHeader("COURSE DETAILS", currentY);

    currentY = addTwoColumn(
      `Course: ${student.courses[0]?.name || "N/A"}`,
      `Course ID: ${student.courses[0]?.id || "N/A"}`,
      currentY
    );
    currentY = addTwoColumn(
      `Total Installments: ${payment.installments.length}`,
      `Paid Installments: ${installmentsPaid}`,
      currentY
    );

    currentY += 15;

    // ==================== FEE STRUCTURE ====================
    currentY = addSectionHeader("FEE STRUCTURE", currentY);

    currentY = addAmountRow("Total Course Fee:", payment.totalFee, currentY);
    currentY = addAmountRow("Discount Applied:", payment.discount, currentY);
    currentY = addAmountRow("GST (18%):", payment.gst, currentY);
    currentY = addAmountRow(
      "Final Course Fee:",
      payment.finalFee,
      currentY,
      true
    );

    currentY += 15;
    drawSeparator(currentY);
    currentY += 15;

    // ==================== INSTALLMENT DETAILS ====================
    currentY = addSectionHeader("INSTALLMENT PAYMENT DETAILS", currentY);

    currentY = addTwoColumn(
      `Installment Number: ${installment.installmentNo}`,
      `Status: ${installment.status.toUpperCase()}`,
      currentY
    );
    currentY = addTwoColumn(
      `Due Date: ${formatDate(installment.dueDate)}`,
      `Paid Date: ${formatDate(installment.paidDate)}`,
      currentY
    );

    currentY += 10;

    // Installment Amount Breakdown
    currentY = addAmountRow(
      "Installment Amount:",
      installment.totalPayable,
      currentY
    );
    currentY = addAmountRow("Amount Paid:", installment.paidAmount, currentY);

    // Payment Method from paidHistory
    if (paymentHistory) {
      currentY = addTwoColumn(
        `Payment Method: ${paymentHistory.method}`,
        `Transaction Status: ${paymentHistory.status}`,
        currentY
      );
    }

    currentY += 10;

    // Notes Section
    // if (installment.notes && installment.notes.trim()) {
    //   doc
    //     .fontSize(10)
    //     .font(doc._font ? "Noto-Bold" : "Helvetica-Bold")
    //     .text("Notes:", 40, currentY);

    //   currentY += 15;

    //   doc
    //     .fontSize(9)
    //     .font(doc._font ? "Noto" : "Helvetica")
    //     .text(installment.notes, 40, currentY, {
    //       width: 515,
    //     });

    //   currentY = doc.y + 10;
    // }

    currentY += 10;
    drawSeparator(currentY);
    currentY += 15;

    // ==================== PAYMENT SUMMARY ====================
    currentY = addSectionHeader("PAYMENT SUMMARY", currentY);

    currentY = addAmountRow("Total Amount Paid:", totalPaid, currentY);
    currentY = addAmountRow("Remaining Balance:", totalPending, currentY);
    currentY = addTwoColumn(
      `Payment Progress:`,
      `${progressPercentage}%`,
      currentY,
      false,
      true
    );

    // Progress bar visualization
    // const progressBarY = currentY + 5;
    // const progressBarWidth = 515;
    // const filledWidth = (progressPercentage / 100) * progressBarWidth;

    // Background bar
    // doc.rect(40, progressBarY, progressBarWidth, 8).fillColor("#f0f0f0").fill();

    // Progress fill
    // doc
    //   .rect(40, progressBarY, filledWidth, 8)
    //   .fillColor(progressPercentage === 100 ? "#28a745" : "#007bff")
    //   .fill();

    // Border
    // doc
    //   .rect(40, progressBarY, progressBarWidth, 8)
    //   .strokeColor("#000000")
    //   .lineWidth(0.5)
    //   .stroke();

    // currentY = progressBarY + 20;

    // ==================== FOOTER SECTION ====================
    currentY += 10;
    drawSeparator(currentY);
    currentY += 15;

    // Terms and Conditions
    // doc
    //   .fontSize(8)
    //   .font(doc._font ? "Noto" : "Helvetica-Oblique")
    //   .fillColor("#666666")
    //   .text(
    //     "This is a computer-generated receipt and does not require a physical signature.",
    //     {
    //       align: "center",
    //     }
    //   );

    // currentY = doc.y + 15;
    doc
      .fontSize(8)
      .font(doc._font ? "Noto" : "Helvetica-Oblique")
      .fillColor("#666666")
      .text(
        "This is a computer-generated receipt and does not require a physical signature.",
        40, // x (safe left margin)
        currentY, // y position
        {
          width: 520, // full width of A4 minus margins
          align: "center",
        }
      );

    currentY = doc.y + 7;

    // Signature section in two columns
    const signatureY = currentY;

    // Left - Authorized by
    // doc
    //   .fontSize(9)
    //   .font(doc._font ? "Noto" : "Helvetica")
    //   .fillColor("#000000")
    //   .text("Authorized By:", 40, signatureY);

    // doc
    //   .fontSize(10)
    //   .font(doc._font ? "Noto-Bold" : "Helvetica-Bold")
    //   .text(
    //     student.ManagerId?.name || "System Administrator",
    //     40,
    //     signatureY + 12
    //   );

    // doc
    //   .fontSize(8)
    //   .font(doc._font ? "Noto" : "Helvetica")
    //   .text(
    //     `Contact: ${student.ManagerId?.phone || "1223456789"}`,
    //     40,
    //     signatureY + 28
    //   )
    //   .text(
    //     `Email: ${student.ManagerId?.email || "support@uplguru.com"}`,
    //     40,
    //     signatureY + 40
    //   );

    // Right - Signature box
    // const signatureBoxX = 400;
    // doc
    //   .rect(signatureBoxX, signatureY, 155, 60)
    //   .strokeColor("#000000")
    //   .lineWidth(0.5)
    //   .stroke();

    // doc
    //   .fontSize(9)
    //   .font(doc._font ? "Noto" : "Helvetica")
    //   .text("Authorized Signature", signatureBoxX + 35, signatureY + 20);

    // // Signature line
    // doc
    //   .moveTo(signatureBoxX + 25, signatureY + 40)
    //   .lineTo(signatureBoxX + 130, signatureY + 40)
    //   .stroke();

    // currentY = signatureY + 80;

    // Generated timestamp
    doc
      .fontSize(8)
      .font(doc._font ? "Noto" : "Helvetica-Oblique")
      .fillColor("#666666")
      .text(`Generated on: ${new Date().toLocaleString("en-IN")}`, {
        align: "center",
      });

    // Page number
    // const pages = doc.bufferedPageRange();
    // for (let i = 0; i < pages.count; i++) {
    //   doc.switchToPage(i);

    //   doc
    //     .fontSize(8)
    //     .font(doc._font ? "Noto" : "Helvetica")
    //     .fillColor("#666666")
    //     .text(`Page ${i + 1} of ${pages.count}`, 40, doc.page.height - 30, {
    //       align: "center",
    //       width: 515,
    //     });
    // }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating payment slip PDF:", error);

    // If PDF document was created, end it
    if (doc) {
      doc.end();
    }

    // If headers already sent, just end the response
    if (res.headersSent) {
      return res.end();
    }

    // Send JSON error response
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message,
    });
  }
};
