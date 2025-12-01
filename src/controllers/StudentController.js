// import Student from "../models/Student.js";
// import StudentLead from "../models/StudentLead.js";
// import mongoose from "mongoose";

// export const createStudent = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const body = req.body;
//     const leadId = req.params.studentLeadId || body.studentLeadId;
//     const franchiseId = req.user._id;

//     console.log("=== Creating Student ===");
//     console.log("Lead ID:", leadId);
//     console.log("Franchise ID:", franchiseId);

//     // 1. Find and validate lead
//     const studentLead = await StudentLead.findOne({
//       _id: leadId,
//       FranchiseId: franchiseId,
//     }).session(session);

//     if (!studentLead) {
//       await session.abortTransaction();
//       session.endSession();
//       console.log("❌ Lead not found or unauthorized");
//       return res.status(404).json({
//         success: false,
//         message: "Student lead not found or you don't have permission",
//       });
//     }

//     if (studentLead.status === "Converted") {
//       await session.abortTransaction();
//       session.endSession();
//       console.log("❌ Lead already converted");
//       return res.status(400).json({
//         success: false,
//         message: "This lead has already been converted to a student",
//       });
//     }

//     console.log(
//       "✅ Lead found:",
//       studentLead.name,
//       "Status:",
//       studentLead.status
//     );

//     // 2. Parse JSON data (handle edge cases)
//     let courses = [];
//     let payment = {};

//     try {
//       // Remove any extra quotes or whitespace
//       const coursesStr = body.courses?.toString().trim();
//       const paymentStr = body.payment?.toString().trim();

//       if (coursesStr && coursesStr !== "[object Object]") {
//         courses = JSON.parse(coursesStr);
//       }

//       if (paymentStr && paymentStr !== "[object Object]") {
//         payment = JSON.parse(paymentStr);
//       }

//       console.log("✅ Parsed courses:", courses.length, "items");
//       console.log("✅ Parsed payment structure:", Object.keys(payment));
//     } catch (error) {
//       await session.abortTransaction();
//       session.endSession();
//       console.log("❌ JSON parsing error:", error.message);
//       return res.status(400).json({
//         success: false,
//         message: "Invalid data format",
//         error: error.message,
//       });
//     }

//     // 3. Parse numeric values (handle leading zeros)
//     const parseNumber = (value) => {
//       if (typeof value === "string") {
//         // Remove any non-numeric characters except decimal point
//         const cleaned = value.replace(/[^0-9.-]/g, "");
//         return parseFloat(cleaned) || 0;
//       }
//       return parseFloat(value) || 0;
//     };

//     const totalFee = parseNumber(payment.totalFee);
//     const discount = parseNumber(payment.discount);
//     const gstAmount = parseNumber(payment.gstAmount);
//     const finalFee = parseNumber(payment.finalFee);

//     console.log("💰 Payment calculation:");
//     console.log("  - Total Fee:", totalFee);
//     console.log("  - Discount:", discount);
//     console.log("  - GST:", gstAmount);
//     console.log("  - Final Fee:", finalFee);

//     // 4. Build address object
//     const address = {
//       street: body["address.street"] || "",
//       area: body["address.area"] || "",
//       landmark: body["address.landmark"] || "",
//       city: body["address.city"] || "",
//       state: body["address.state"] || "",
//       zip: body["address.zip"] || "",
//       country: "India",
//     };

//     console.log("🏠 Address:", `${address.city}, ${address.state}`);

//     // 5. Process installments
//     let installments = [];
//     if (Array.isArray(payment.installments)) {
//       installments = payment.installments.map((inst, index) => ({
//         installmentNo: inst.installmentNo || index + 1,
//         dueDate: inst.dueDate
//           ? new Date(inst.dueDate)
//           : new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000), // 30 days apart
//         originalAmount: parseNumber(inst.originalAmount),
//         franchiseDiscount: parseNumber(inst.franchiseDiscount),
//         finalAmount: parseNumber(inst.finalAmount),
//         gstAmount: parseNumber(inst.gstAmount),
//         totalPayable: parseNumber(inst.totalPayable),
//         status: inst.status || "pending",
//         paidDate: inst.paidDate ? new Date(inst.paidDate) : null,
//         paidAmount: parseNumber(inst.paidAmount),
//         paymentMode: inst.paymentMode || null,
//       }));
//     }

//     console.log("📅 Installments created:", installments.length);

//     // 6. Create student object
//     const studentData = {
//       name: body.name?.trim(),
//       phone: body.phone?.toString().trim(),
//       email: body.email?.trim().toLowerCase(),
//       qualification: body.qualification?.trim(),
//       yearOfPassout: parseInt(body.yearOfPassout) || new Date().getFullYear(),
//       address: address,
//       courses: courses.map((course) => ({
//         id: course.id || course._id || "",
//         name: course.name || "",
//       })),
//       payment: [
//         {
//           totalFee: totalFee,
//           discount: discount,
//           finalFee: finalFee,
//           gst: gstAmount,
//           installments: installments,
//           paidHistory: [],
//         },
//       ],
//       FranchiseId: franchiseId,
//       ManagerId: studentLead.ManagerId,
//       ClientId: studentLead.ClientId,
//       convertedFromLead: leadId,
//       enrollmentDate: new Date(),
//     };

//     console.log("📝 Student data prepared");

//     // 7. Create and validate student
//     const student = new Student(studentData);

//     // Manual validation
//     const validationError = student.validateSync();
//     if (validationError) {
//       const errors = {};
//       Object.keys(validationError.errors).forEach((key) => {
//         errors[key] = validationError.errors[key].message;
//       });

//       await session.abortTransaction();
//       session.endSession();

//       console.log("❌ Validation errors:", errors);

//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: errors,
//       });
//     }

//     // 8. Save student
//     const savedStudent = await student.save({ session });
//     console.log("✅ Student saved:", savedStudent._id);

//     // 9. Update lead status
//     studentLead.status = "Converted";
//     studentLead.convertedAt = new Date();
//     studentLead.convertedToStudentId = savedStudent._id;
//     await studentLead.save({ session });
//     console.log("✅ Lead updated to 'Converted'");

//     // 10. Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     // 11. Prepare success response
//     const responseData = {
//       success: true,
//       message: "Student enrolled successfully",
//       data: {
//         student: {
//           id: savedStudent._id,
//           name: savedStudent.name,
//           email: savedStudent.email,
//           phone: savedStudent.phone,
//           course: savedStudent.courses[0]?.name || "Unknown",
//           finalFee: savedStudent.payment[0]?.finalFee || 0,
//           installments: savedStudent.payment[0]?.installments?.length || 0,
//         },
//         lead: {
//           id: leadId,
//           name: studentLead.name,
//           status: "Converted",
//           convertedAt: studentLead.convertedAt,
//         },
//       },
//     };

//     console.log("🎉 Student enrollment completed successfully!");
//     console.log("Response:", JSON.stringify(responseData, null, 2));

//     res.status(201).json(responseData);
//   } catch (error) {
//     // Handle errors
//     await session.abortTransaction();
//     session.endSession();

//     console.error("❌ Error creating student:", error);
//     console.error("Error stack:", error.stack);

//     // Specific error handling
//     if (error.name === "ValidationError") {
//       const errors = {};
//       Object.keys(error.errors).forEach((key) => {
//         errors[key] = error.errors[key].message;
//       });

//       console.error("Validation errors:", errors);

//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: errors,
//       });
//     }

//     if (error.name === "MongoServerError" && error.code === 11000) {
//       console.error("Duplicate key error:", error.keyPattern);
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({
//         success: false,
//         message: `Student with this ${field} already exists.`,
//       });
//     }

//     // General error
//     const errorResponse = {
//       success: false,
//       message: "Failed to create student enrollment",
//       error: error.message,
//     };

//     if (process.env.NODE_ENV === "development") {
//       errorResponse.stack = error.stack;
//     }

//     console.error("Error response:", errorResponse);
//     res.status(500).json(errorResponse);
//   }
// };

// Add this temporary route for debugging

import Student from "../models/Student.js";
import StudentLead from "../models/StudentLead.js";
import mongoose from "mongoose";

export const createStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = req.body;
    const leadId = req.params.studentLeadId || body.studentLeadId;
    const franchiseId = req.user._id;

    // 1. Find and validate lead

    const studentLead = await StudentLead.findOne({
      //   _id: leadId,
      _id: req.params.studentLeadId,
      //   franchiseId: franchiseId,
      franchiseId: req.user.franchiseId,
    }).session(session);

    if (!studentLead) {
      await session.abortTransaction();
      session.endSession();
      console.log("❌ Lead not found or unauthorized");
      return res.status(404).json({
        success: false,
        message: "Student lead not found or you don't have permission",
      });
    }

    if (studentLead.status === "Converted") {
      await session.abortTransaction();
      session.endSession();
      console.log("❌ Lead already converted");
      return res.status(400).json({
        success: false,
        message: "This lead has already been converted to a student",
      });
    }

    console.log(
      "✅ Lead found:",
      studentLead.name,
      "Status:",
      studentLead.status
    );

    // 2. Transform dot notation to nested object
    const transformedBody = { ...body };

    // Extract address fields from dot notation
    if (body["address.street"] || body["address.city"]) {
      transformedBody.address = {
        street: body["address.street"] || "",
        area: body["address.area"] || "",
        landmark: body["address.landmark"] || "",
        city: body["address.city"] || "",
        state: body["address.state"] || "",
        zip: body["address.zip"] || "",
        country: "India",
      };

      // Remove the old dot notation fields
      delete transformedBody["address.street"];
      delete transformedBody["address.area"];
      delete transformedBody["address.landmark"];
      delete transformedBody["address.city"];
      delete transformedBody["address.state"];
      delete transformedBody["address.zip"];
    }

    console.log("✅ Transformed body address:", transformedBody.address);

    // 3. Parse JSON data
    let courses = [];
    let payment = {};

    try {
      // Parse courses
      if (transformedBody.courses) {
        if (typeof transformedBody.courses === "string") {
          courses = JSON.parse(transformedBody.courses);
        } else if (Array.isArray(transformedBody.courses)) {
          courses = transformedBody.courses;
        }
      }

      // Parse payment
      if (transformedBody.payment) {
        if (typeof transformedBody.payment === "string") {
          payment = JSON.parse(transformedBody.payment);
        } else if (typeof transformedBody.payment === "object") {
          payment = transformedBody.payment;
        }
      }

      console.log("✅ Parsed courses:", courses);
      console.log("✅ Parsed payment:", payment);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log("❌ JSON parsing error:", error.message);
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: error.message,
      });
    }

    // 4. Parse numeric values
    const parseNumber = (value) => {
      if (typeof value === "string") {
        // Remove any leading zeros
        const cleaned = value.replace(/^0+/, "");
        return parseFloat(cleaned) || 0;
      }
      return parseFloat(value) || 0;
    };

    const totalFee = parseNumber(payment.totalFee);
    const discount = parseNumber(payment.discount);
    const gstAmount = parseNumber(payment.gstAmount);
    const finalFee = parseNumber(payment.finalFee);

    console.log("💰 Payment calculation:");
    console.log("  - Total Fee:", totalFee);
    console.log(
      "  - Discount:",
      discount,
      "(Original value:",
      transformedBody.discount,
      ")"
    );
    console.log("  - GST:", gstAmount);
    console.log("  - Final Fee:", finalFee);

    // 5. Process installments
    let installments = [];
    if (Array.isArray(payment.installments)) {
      installments = payment.installments.map((inst, index) => ({
        installmentNo: inst.installmentNo || index + 1,
        dueDate: inst.dueDate
          ? new Date(inst.dueDate)
          : new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
        originalAmount: parseNumber(inst.originalAmount),
        franchiseDiscount: parseNumber(inst.franchiseDiscount),
        finalAmount: parseNumber(inst.finalAmount),
        gstAmount: parseNumber(inst.gstAmount),
        totalPayable: parseNumber(inst.totalPayable),
        status: inst.status || "pending",
        paidDate: inst.paidDate ? new Date(inst.paidDate) : null,
        paidAmount: parseNumber(inst.paidAmount),
        paymentMode: inst.paymentMode || null,
      }));
    }

    console.log("📅 Installments created:", installments.length);

    // 6. Create student object
    const studentData = {
      name: transformedBody.name?.trim(),
      phone: transformedBody.phone?.toString().trim(),
      email: transformedBody.email?.trim().toLowerCase(),
      qualification: transformedBody.qualification?.trim(),
      yearOfPassout:
        parseInt(transformedBody.yearOfPassout) || new Date().getFullYear(),
      address: transformedBody.address || {
        street: "",
        area: "",
        landmark: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
      },
      courses: courses.map((course) => ({
        id: course.id || course._id || "",
        name: course.name || "",
      })),
      payment: [
        {
          totalFee: totalFee,
          discount: discount,
          finalFee: finalFee,
          gst: gstAmount,
          installments: installments,
          paidHistory: [],
        },
      ],
      FranchiseId: franchiseId,
      ManagerId: req.user.managerId,
      ClientId: req.user.clientId,
      convertedFromLead: leadId,
      enrollmentDate: new Date(),
    };

    console.log("📝 Student data prepared:", {
      name: studentData.name,
      phone: studentData.phone,
      email: studentData.email,
      courseCount: studentData.courses.length,
      address: studentData.address.city,
    });

    // 7. Create and validate student
    const student = new Student(studentData);

    // Manual validation
    try {
      await student.validate();
    } catch (validationError) {
      await session.abortTransaction();
      session.endSession();

      const errors = {};
      Object.keys(validationError.errors).forEach((key) => {
        errors[key] = validationError.errors[key].message;
      });

      console.log("❌ Validation errors:", errors);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // 8. Save student
    const savedStudent = await student.save({ session });
    console.log("✅ Student saved:", savedStudent._id);

    // 9. Update lead status
    studentLead.status = "Converted";
    studentLead.convertedAt = new Date();
    studentLead.convertedToStudentId = savedStudent._id;
    await studentLead.save({ session });
    console.log("✅ Lead updated to 'Converted'");

    // 10. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 11. Prepare success response
    const responseData = {
      success: true,
      message: "Student enrolled successfully",
      data: {
        student: {
          id: savedStudent._id,
          name: savedStudent.name,
          email: savedStudent.email,
          phone: savedStudent.phone,
          course: savedStudent.courses[0]?.name || "Unknown",
          finalFee: savedStudent.payment[0]?.finalFee || 0,
          installments: savedStudent.payment[0]?.installments?.length || 0,
        },
        lead: {
          id: leadId,
          name: studentLead.name,
          status: "Converted",
          convertedAt: studentLead.convertedAt,
        },
      },
    };

    console.log("🎉 Student enrollment completed successfully!");
    console.log("Response:", JSON.stringify(responseData, null, 2));

    res.status(201).json(responseData);
  } catch (error) {
    // Handle errors
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Error creating student:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Specific error handling
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      console.error("Validation errors:", errors);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    if (error.name === "MongoServerError" && error.code === 11000) {
      console.error("Duplicate key error:", error.keyPattern);
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Student with this ${field} already exists.`,
      });
    }

    // General error
    const errorResponse = {
      success: false,
      message: "Failed to create student enrollment",
      error: error.message,
    };

    if (process.env.NODE_ENV === "development") {
      errorResponse.stack = error.stack;
    }

    console.error("Error response:", errorResponse);
    res.status(500).json(errorResponse);
  }
};
// controllers/StudentController.js
export const debugCreateStudent = async (req, res, next) => {
  // Add `next` parameter
  console.log("=== DEBUG: Create Student Request ===");
  console.log("Headers:", req.headers);
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("User:", req.user);

  // Just log and pass to next middleware
  try {
    const body = req.body;

    // Try to parse JSON fields
    let courses = [],
      payment = {};
    try {
      courses = JSON.parse(body.courses);
    } catch (e) {
      console.log("Courses parse error:", e.message);
    }

    try {
      payment = JSON.parse(body.payment);
    } catch (e) {
      console.log("Payment parse error:", e.message);
    }

    console.log("Parsed courses:", courses);
    console.log("Parsed payment:", payment);

    // Call next() to pass to createStudent
    next(); // Now next is defined
  } catch (error) {
    console.error("Debug middleware error:", error);
    next(error); // Pass error to error handler
  }
};
