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
    const franchiseId = req.user.franchiseId;

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

    // 5.1 — Distribute GST equally across all installments
    // const totalGST = gstAmount; // payment.gst from user input
    // const installmentCount = installments.length;

    // if (installmentCount > 0 && totalGST > 0) {
    //   const gstPerInstallment = Number(
    //     (totalGST / installmentCount).toFixed(2)
    //   );

    //   let remainingGST = totalGST;

    //   installments = installments.map((inst, index) => {
    //     // Last installment gets leftover (rounding fix)
    //     if (index === installmentCount - 1) {
    //       inst.gstAmount = Number(remainingGST.toFixed(2));
    //     } else {
    //       inst.gstAmount = gstPerInstallment;
    //       remainingGST -= gstPerInstallment;
    //     }

    //     inst.totalPayable =
    //       inst.originalAmount - (inst.franchiseDiscount || 0) + inst.gstAmount;

    //     return inst;
    //   });
    // }

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
// export const debugCreateStudent = async (req, res, next) => {
//   // Add `next` parameter
//   console.log("=== DEBUG: Create Student Request ===");
//   console.log("Headers:", req.headers);
//   console.log("Params:", req.params);
//   console.log("Body:", req.body);
//   console.log("User:", req.user);

//   // Just log and pass to next middleware
//   try {
//     const body = req.body;

//     // Try to parse JSON fields
//     let courses = [],
//       payment = {};
//     try {
//       courses = JSON.parse(body.courses);
//     } catch (e) {
//       console.log("Courses parse error:", e.message);
//     }

//     try {
//       payment = JSON.parse(body.payment);
//     } catch (e) {
//       console.log("Payment parse error:", e.message);
//     }

//     console.log("Parsed courses:", courses);
//     console.log("Parsed payment:", payment);

//     // Call next() to pass to createStudent
//     next(); // Now next is defined
//   } catch (error) {
//     console.error("Debug middleware error:", error);
//     next(error); // Pass error to error handler
//   }
// };

// export const getInstallmentPayments = async (req, res) => {
//   console.log("📥 Received request:", req.query);
//   try {
//     const {
//       name,
//       phone,
//       dueDateFrom,
//       dueDateTo,
//       page = 1,
//       pageSize = 10,
//     } = req.query;

//     const filters = { FranchiseId: req.user.FranchiseId };

//     // Basic text filters
//     if (name) filters.name = { $regex: name, $options: "i" };
//     if (phone) filters.phone = { $regex: phone, $options: "i" };

//     // Fetch only students that match base filters
//     const students = await Student.find(filters)
//       .select("name phone courses payment")
//       .lean();

//     // Flatten installments
//     let installmentsList = [];

//     students.forEach((student) => {
//       student.payment.forEach((p) => {
//         p.installments.forEach((inst) => {
//           installmentsList.push({
//             studentId: student._id,
//             studentName: student.name,
//             phone: student.phone,
//             course: student?.courses?.[0]?.name || "",
//             installmentNo: inst.installmentNo,
//             dueDate: inst.dueDate,
//             amount: inst.totalPayable,
//             status: inst.status,
//           });
//         });
//       });
//     });

//     // Date filters applied AFTER flattening
//     if (dueDateFrom || dueDateTo) {
//       installmentsList = installmentsList.filter((item) => {
//         const due = new Date(item.dueDate);

//         if (dueDateFrom && due < new Date(dueDateFrom)) return false;
//         if (dueDateTo && due > new Date(dueDateTo)) return false;

//         return true;
//       });
//     }

//     // Total count BEFORE pagination
//     const total = installmentsList.length;

//     // Pagination logic
//     const startIndex = (page - 1) * pageSize;
//     const paginatedData = installmentsList.slice(
//       startIndex,
//       startIndex + parseInt(pageSize)
//     );

//     const pageCount = Math.ceil(total / pageSize);

//     return res.status(200).json({
//       success: true,
//       data: paginatedData,
//       meta: {
//         page: Number(page),
//         pageSize: Number(pageSize),
//         pageCount,
//         total,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching installment payments:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
// GET /student/installment-payments
// export const getInstallmentPayments = async (req, res) => {
//   console.log("📥 Received request:", req.query);

//   try {
//     let {
//       name,
//       phone,
//       dueDateFrom,
//       dueDateTo,
//       page = 1,
//       pageSize = 10,
//     } = req.query;

//     page = Number(page);
//     pageSize = Number(pageSize);

//     const filters = { FranchiseId: req.user.FranchiseId };

//     // Basic filters
//     if (name) filters.name = { $regex: name, $options: "i" };
//     if (phone) filters.phone = { $regex: phone, $options: "i" };

//     // Fetch students belonging to this franchise
//     const students = await Student.find(filters)
//       .select("name phone courses payment")
//       .lean();

//     let installmentsList = [];

//     students.forEach((student) => {
//       student.payment.forEach((p) => {
//         p.installments.forEach((inst) => {
//           installmentsList.push({
//             studentId: student._id,
//             studentName: student.name,
//             phone: student.phone,
//             course: student?.courses?.[0]?.name || "",
//             installmentNo: inst.installmentNo,
//             dueDate: inst.dueDate,
//             amount: inst.totalPayable,
//             status: inst.status,
//           });
//         });
//       });
//     });

//     // Apply date filters (only if provided)
//     if (dueDateFrom || dueDateTo) {
//       installmentsList = installmentsList.filter((item) => {
//         const due = new Date(item.dueDate);

//         if (dueDateFrom && due < new Date(dueDateFrom)) return false;
//         if (dueDateTo && due > new Date(dueDateTo)) return false;

//         return true;
//       });
//     }

//     const total = installmentsList.length;
//     const pageCount = Math.ceil(total / pageSize);

//     // Pagination always applies (even if no filters)
//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;

//     const paginatedData = installmentsList.slice(start, end);

//     return res.status(200).json({
//       success: true,
//       data: paginatedData,
//       meta: {
//         page,
//         pageSize,
//         pageCount,
//         total,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching installment payments:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// export const getInstallmentPayments = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       pageSize = 10,
//       name,
//       phone,
//       email,
//       courseName,
//       dueDateFrom,
//       dueDateTo,
//       status,
//       installmentNo,
//       minAmount,
//       maxAmount,
//       sortBy = "dueDate",
//       sortOrder = "asc",
//     } = req.query;

//     const pageNum = parseInt(page);
//     const limit = parseInt(pageSize);
//     const skip = (pageNum - 1) * limit;

//     // Build base filter
//     const filter = {};
//     if (name) filter.name = { $regex: name, $options: "i" };
//     if (phone) filter.phone = { $regex: phone, $options: "i" };
//     if (email) filter.email = { $regex: email, $options: "i" };
//     if (req.user?.FranchiseId) filter.FranchiseId = req.user.FranchiseId;

//     // Start aggregation pipeline
//     let pipeline = [];

//     // Match students
//     if (Object.keys(filter).length > 0) {
//       pipeline.push({ $match: filter });
//     }

//     // Unwind payments and installments
//     pipeline.push({ $unwind: "$payment" });
//     pipeline.push({ $unwind: "$payment.installments" });

//     // Lookup course name from courses array
//     pipeline.push({
//       $addFields: {
//         courseName: { $arrayElemAt: ["$courses.name", 0] },
//       },
//     });

//     // Filter by course name
//     if (courseName) {
//       pipeline.push({
//         $match: {
//           courseName: { $regex: courseName, $options: "i" },
//         },
//       });
//     }

//     // Add field for easier filtering
//     pipeline.push({
//       $addFields: {
//         installment: "$payment.installments",
//       },
//     });

//     // Apply installment filters
//     const installmentFilter = {};

//     if (status) installmentFilter["installment.status"] = status;
//     if (installmentNo) {
//       installmentFilter["installment.installmentNo"] = parseInt(installmentNo);
//     }

//     // Date range filter
//     if (dueDateFrom || dueDateTo) {
//       installmentFilter["installment.dueDate"] = {};
//       if (dueDateFrom) {
//         installmentFilter["installment.dueDate"].$gte = new Date(dueDateFrom);
//       }
//       if (dueDateTo) {
//         installmentFilter["installment.dueDate"].$lte = new Date(dueDateTo);
//       }
//     }

//     // Amount range filter
//     if (minAmount || maxAmount) {
//       installmentFilter["installment.totalPayable"] = {};
//       if (minAmount) {
//         installmentFilter["installment.totalPayable"].$gte =
//           parseFloat(minAmount);
//       }
//       if (maxAmount) {
//         installmentFilter["installment.totalPayable"].$lte =
//           parseFloat(maxAmount);
//       }
//     }

//     if (Object.keys(installmentFilter).length > 0) {
//       pipeline.push({ $match: installmentFilter });
//     }

//     // Create count pipeline
//     const countPipeline = [...pipeline];
//     countPipeline.push({ $count: "total" });

//     // Sorting
//     const sortOrderNum = sortOrder === "desc" ? -1 : 1;
//     pipeline.push({
//       $sort: { [`installment.${sortBy}`]: sortOrderNum },
//     });

//     // Pagination
//     pipeline.push({ $skip: skip });
//     pipeline.push({ $limit: limit });

//     // Project final fields
//     pipeline.push({
//       $project: {
//         studentId: "$_id",
//         name: 1,
//         phone: 1,
//         email: 1,
//         courseName: 1,
//         totalFee: "$payment.totalFee",
//         finalFee: "$payment.finalFee",
//         installment: 1,
//         FranchiseId: 1,
//         createdAt: 1,
//       },
//     });

//     // Execute queries
//     const [data, countResult] = await Promise.all([
//       Student.aggregate(pipeline),
//       Student.aggregate(countPipeline),
//     ]);

//     const total = countResult[0]?.total || 0;
//     const pageCount = Math.ceil(total / limit);

//     res.status(200).json({
//       success: true,
//       data,
//       meta: {
//         pagination: {
//           page: pageNum,
//           pageSize: limit,
//           pageCount,
//           total,
//         },
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching installment payments",
//       error: error.message,
//     });
//   }
// };
// export const getInstallmentPayments = async (req, res) => {
//   console.log("📥 Received request:", req.query);

//   try {
//     let {
//       name,
//       phone,
//       dueDateFrom,
//       dueDateTo,
//       page = 1,
//       pageSize = 10,
//     } = req.query;

//     page = Number(page);
//     pageSize = Number(pageSize);

//     const filters = { FranchiseId: req.user.FranchiseId };

//     // Basic filters
//     if (name) filters.name = { $regex: name, $options: "i" };
//     if (phone) filters.phone = { $regex: phone, $options: "i" };

//     // Fetch students belonging to this franchise
//     const students = await Student.find(filters)
//       .select("name phone courses payment")
//       .lean();

//     let installmentsList = [];

//     students.forEach((student) => {
//       student.payment.forEach((p) => {
//         p.installments.forEach((inst) => {
//           installmentsList.push({
//             studentId: student._id,
//             studentName: student.name,
//             phone: student.phone,
//             course: student?.courses?.[0]?.name || "",
//             installmentNo: inst.installmentNo,
//             dueDate: inst.dueDate,
//             amount: inst.totalPayable,
//             status: inst.status,
//           });
//         });
//       });
//     });

//     // Apply date filters (only if provided)
//     if (dueDateFrom || dueDateTo) {
//       installmentsList = installmentsList.filter((item) => {
//         const due = new Date(item.dueDate);

//         if (dueDateFrom && due < new Date(dueDateFrom)) return false;
//         if (dueDateTo && due > new Date(dueDateTo)) return false;

//         return true;
//       });
//     }

//     const total = installmentsList.length;
//     const pageCount = Math.ceil(total / pageSize);

//     // Pagination always applies (even if no filters)
//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;

//     const paginatedData = installmentsList.slice(start, end);

//     return res.status(200).json({
//       success: true,
//       data: paginatedData,
//       meta: {
//         page,
//         pageSize,
//         pageCount,
//         total,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching installment payments:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
// export const getInstallmentPayments = async (req, res) => {
//   console.log("📥 Received installment payment request:", req.query);

//   try {
//     let {
//       name,
//       phone,
//       dueDateFrom,
//       dueDateTo,
//       page = 1,
//       pageSize = 10,
//     } = req.query;

//     page = Number(page);
//     pageSize = Number(pageSize);

//     // Always filter by logged-in franchise
//     const filters = { FranchiseId: req.user.franchiseId.toString() };

//     // Optional name filter
//     if (name) filters.name = { $regex: name, $options: "i" };

//     // Optional phone filter
//     if (phone) filters.phone = { $regex: phone, $options: "i" };

//     // Step 1: Fetch students belonging to the franchise (with their payments)
//     const students = await Student.find(filters)
//       .select("name phone courses payment")
//       .lean();

//     let installmentsList = [];

//     students.forEach((student) => {
//       student.payment.forEach((p) => {
//         p.installments.forEach((inst) => {
//           installmentsList.push({
//             studentId: student._id,
//             studentName: student.name,
//             phone: student.phone,
//             course: student?.courses?.[0]?.name || "",
//             installmentNo: inst.installmentNo,
//             dueDate: inst.dueDate,
//             amount: inst.totalPayable,
//             status: inst.status,
//           });
//         });
//       });
//     });

//     // Step 3: Apply optional date filtering
//     if (dueDateFrom || dueDateTo) {
//       const from = dueDateFrom ? new Date(dueDateFrom) : null;
//       const to = dueDateTo ? new Date(dueDateTo) : null;

//       installmentsList = installmentsList.filter((item) => {
//         const due = new Date(item.dueDate);

//         if (from && due < from) return false;
//         if (to && due > to) return false;

//         return true;
//       });
//     }

//     // Step 4: Pagination after filtering (always applied)
//     const total = installmentsList.length;
//     const pageCount = Math.ceil(total / pageSize);

//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;

//     const paginatedData = installmentsList.slice(start, end);

//     // Step 5: Return final result
//     return res.status(200).json({
//       success: true,
//       data: paginatedData,
//       meta: {
//         page,
//         pageSize,
//         pageCount,
//         total,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching installment payments:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
// controllers/installmentController.js
// const Student = require('../models/Student');

// export const getInstallmentPayments = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       pageSize = 10,
//       name,
//       phone,
//       dueDateFrom,
//       dueDateTo,
//       status,
//       installmentNo,
//     } = req.query;

//     // Parse query parameters
//     const pageNum = parseInt(page);
//     const limit = parseInt(pageSize);
//     const skip = (pageNum - 1) * limit;

//     // Build filter query
//     const filter = {};

//     // Text search filters
//     if (name) {
//       filter.name = { $regex: name, $options: "i" };
//     }
//     if (phone) {
//       filter.phone = { $regex: phone, $options: "i" };
//     }

//     // For franchise filtering (if needed)
//     if (req.user?.FranchiseId) {
//       filter.FranchiseId = req.user.FranchiseId;
//     }

//     // Create pipeline for aggregation
//     const pipeline = [];

//     // Match stage for student filtering
//     if (Object.keys(filter).length > 0) {
//       pipeline.push({ $match: filter });
//     }

//     // Unwind payment array
//     pipeline.push({ $unwind: "$payment" });

//     // Unwind installments array within each payment
//     pipeline.push({ $unwind: "$payment.installments" });

//     // Add fields for easier filtering
//     pipeline.push({
//       $addFields: {
//         installment: "$payment.installments",
//         paymentId: "$payment._id",
//       },
//     });

//     // Project only needed fields
//     pipeline.push({
//       $project: {
//         studentId: "$_id",
//         name: 1,
//         phone: 1,
//         email: 1,
//         FranchiseId: 1,
//         paymentId: 1,
//         installment: 1,
//         courseName: { $arrayElemAt: ["$courses.name", 0] }, // Get first course name
//         totalFee: "$payment.totalFee",
//         finalFee: "$payment.finalFee",
//       },
//     });

//     // Apply installment-specific filters
//     const installmentFilter = {};

//     if (status) {
//       installmentFilter["installment.status"] = status;
//     }

//     if (installmentNo) {
//       installmentFilter["installment.installmentNo"] = parseInt(installmentNo);
//     }

//     if (dueDateFrom || dueDateTo) {
//       installmentFilter["installment.dueDate"] = {};
//       if (dueDateFrom) {
//         installmentFilter["installment.dueDate"].$gte = new Date(dueDateFrom);
//       }
//       if (dueDateTo) {
//         installmentFilter["installment.dueDate"].$lte = new Date(dueDateTo);
//       }
//     }

//     if (Object.keys(installmentFilter).length > 0) {
//       pipeline.push({ $match: installmentFilter });
//     }

//     // Create a separate pipeline for counting (without skip/limit)
//     const countPipeline = [...pipeline];

//     // Count total documents
//     countPipeline.push({ $count: "total" });

//     // Add sorting (by dueDate ascending)
//     pipeline.push({ $sort: { "installment.dueDate": 1 } });

//     // Add pagination
//     pipeline.push({ $skip: skip });
//     pipeline.push({ $limit: limit });

//     // Execute both pipelines in parallel
//     const [dataResult, countResult] = await Promise.all([
//       Student.aggregate(pipeline),
//       Student.aggregate(countPipeline),
//     ]);

//     const total = countResult.length > 0 ? countResult[0].total : 0;
//     const pageCount = Math.ceil(total / limit);

//     // Format the response
//     const formattedData = dataResult.map((item) => ({
//       studentId: item.studentId,
//       name: item.name,
//       phone: item.phone,
//       email: item.email,
//       courseName: item.courseName,
//       totalFee: item.totalFee,
//       finalFee: item.finalFee,
//       installment: {
//         installmentNo: item.installment.installmentNo,
//         dueDate: item.installment.dueDate,
//         originalAmount: item.installment.originalAmount,
//         franchiseDiscount: item.installment.franchiseDiscount,
//         finalAmount: item.installment.finalAmount,
//         gstAmount: item.installment.gstAmount,
//         totalPayable: item.installment.totalPayable,
//         status: item.installment.status,
//         paidDate: item.installment.paidDate,
//         paidAmount: item.installment.paidAmount,
//       },
//       FranchiseId: item.FranchiseId,
//     }));

//     // Meta object for pagination
//     const meta = {
//       pagination: {
//         page: pageNum,
//         pageSize: limit,
//         pageCount: pageCount,
//         total: total,
//       },
//     };

//     // Return response with or without query params
//     if (Object.keys(req.query).length === 0) {
//       // If no query params, return all data (first 1000 records for safety)
//       const allData = await Student.aggregate([
//         { $unwind: "$payment" },
//         { $unwind: "$payment.installments" },
//         { $limit: 1000 },
//       ]);

//       return res.status(200).json({
//         success: true,
//         data: allData,
//         meta: {
//           pagination: {
//             page: 1,
//             pageSize: allData.length,
//             pageCount: 1,
//             total: allData.length,
//           },
//         },
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: formattedData,
//       meta: meta,
//     });
//   } catch (error) {
//     console.error("Error fetching installment payments:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };
// controllers/installmentController.js - Simplified version
// const Student = require("../models/Student");

export const getInstallmentPayments = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      dueDateFrom,
      dueDateTo,
    } = req.query;

    // console.log(dueDateFrom, dueDateTo);

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.min(100, parseInt(pageSize)); // Max 100 per page
    const skip = (pageNum - 1) * limit;

    // Build query conditions
    const conditions = [];

    // Name filter (case-insensitive, ignore spaces)
    if (name) {
      const cleanName = name.trim().replace(/\s+/g, "");
      conditions.push({
        name: { $regex: new RegExp(cleanName.split("").join("\\s*"), "i") },
      });
    }

    // Phone filter
    if (phone) {
      conditions.push({
        phone: { $regex: phone, $options: "i" },
      });
    }

    // Date range filter on installments
    const dateMatch = {};
    if (dueDateFrom || dueDateTo) {
      dateMatch["payment.installments.dueDate"] = {};
      if (dueDateFrom)
        dateMatch["payment.installments.dueDate"].$gte = new Date(dueDateFrom);
      if (dueDateTo)
        dateMatch["payment.installments.dueDate"].$lte = new Date(dueDateTo);
    }

    // Combine conditions
    let matchStage = {};
    if (conditions.length > 0) {
      matchStage = { $and: conditions };
    }

    // Main pipeline
    const pipeline = [];

    // Match students
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Match by date range if specified
    // if (Object.keys(dateMatch).length > 0) {
    //   pipeline.push({ $match: dateMatch });
    // }

    // Sort by latest first
    pipeline.push({ $sort: { createdAt: -1 } });

    // Unwind and process installments
    pipeline.push({ $unwind: "$payment" });
    pipeline.push({ $unwind: "$payment.installments" });

    // Filter by date after unwind if needed
    if (Object.keys(dateMatch).length > 0) {
      const installmentDateMatch = {};
      // if (dueDateFrom)
      //   installmentDateMatch["payment.installments.dueDate"] = {
      //     $gte: new Date(dueDateFrom),
      //   };
      // if (dueDateTo)
      //   installmentDateMatch["payment.installments.dueDate"] = {
      //     $lte: new Date(dueDateTo),
      //   };
      if (dueDateFrom || dueDateTo) {
        installmentDateMatch["payment.installments.dueDate"] = {};

        if (dueDateFrom)
          installmentDateMatch["payment.installments.dueDate"].$gte = new Date(
            dueDateFrom
          );

        if (dueDateTo)
          installmentDateMatch["payment.installments.dueDate"].$lte = new Date(
            dueDateTo
          );
      }
      pipeline.push({ $match: installmentDateMatch });
    }

    // Group by student
    pipeline.push({
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        phone: { $first: "$phone" },
        email: { $first: "$email" },
        courseName: { $first: { $arrayElemAt: ["$courses.name", 0] } },
        allInstallments: {
          $push: {
            dueDate: "$payment.installments.dueDate",
            status: "$payment.installments.status",
            amount: "$payment.installments.totalPayable",
            installmentNo: "$payment.installments.installmentNo",
          },
        },
        createdAt: { $first: "$createdAt" },
      },
    });

    // Sort installments by due date
    pipeline.push({
      $addFields: {
        allInstallments: {
          $sortArray: {
            input: "$allInstallments",
            sortBy: { dueDate: 1 },
          },
        },
      },
    });

    // Count pipeline (for pagination)
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute queries
    const [students, countResult] = await Promise.all([
      Student.aggregate(pipeline),
      Student.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const pageCount = Math.ceil(total / limit);

    // Format for front-end table
    const formattedStudents = students.map((student) => {
      // Sort installments by due date
      const sortedInstallments = [...student.allInstallments].sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );

      // Get first due date for display
      const firstInstallment = sortedInstallments[0];

      // Check if any installments are overdue
      const hasOverdue = sortedInstallments.some(
        (inst) =>
          inst.status === "pending" && new Date(inst.dueDate) < new Date()
      );

      // Count pending/paid
      const pendingCount = sortedInstallments.filter(
        (inst) => inst.status === "pending"
      ).length;
      const paidCount = sortedInstallments.filter(
        (inst) => inst.status === "paid"
      ).length;

      return {
        studentId: student._id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        courseName: student.courseName,
        // Front-end display properties
        display: {
          // Single date to show in table
          dueDate: firstInstallment?.dueDate,
          formattedDate: firstInstallment?.dueDate
            ? new Date(firstInstallment.dueDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "No due date",
          // Tooltip data
          allInstallments: sortedInstallments.map((inst) => ({
            installmentNo: inst.installmentNo,
            dueDate: inst.dueDate,
            formattedDate: new Date(inst.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            status: inst.status,
            amount: inst.amount,
            isOverdue:
              inst.status === "pending" && new Date(inst.dueDate) < new Date(),
          })),
          // Status indicators
          status: pendingCount > 0 ? "pending" : "paid",
          pendingCount,
          paidCount,
          totalInstallments: sortedInstallments.length,
          hasOverdue,
          // Color coding
          statusColor:
            pendingCount > 0 ? (hasOverdue ? "red" : "orange") : "green",
        },
      };
    });

    res.status(200).json({
      success: true,
      data: formattedStudents,
      meta: {
        pagination: {
          page: pageNum,
          pageSize: limit,
          pageCount: pageCount,
          total: total,
        },
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// export const getInstallmentPayments = async (req, res) => {
//   console.log("📥 Received installment payment request:", req.query);

//   try {
//     let {
//       name,
//       phone,
//       dueDateFrom,
//       dueDateTo,
//       page = 1,
//       pageSize = 10,
//     } = req.query;

//     page = Number(page);
//     pageSize = Number(pageSize);

//     // Always filter by logged-in franchise
//     const filters = { FranchiseId: req.user.franchiseId.toString() };

//     // Optional name filter
//     if (name) filters.name = { $regex: name, $options: "i" };

//     // Optional phone filter
//     if (phone) filters.phone = { $regex: phone, $options: "i" };

//     // Step 1: Fetch students belonging to the franchise (with their payments)
//     const students = await Student.find(filters)
//       .select("name phone courses payment")
//       .lean();

//     let installmentsList = [];

//     // Step 2: Flatten payment → installments into rows
//     students.forEach((student) => {
//       student.payment.forEach((p) => {
//         p.installments.forEach((inst) => {
//           installmentsList.push({
//             studentId: student._id,
//             studentName: student.name,
//             phone: student.phone,
//             course: student?.courses?.[0]?.name || "",
//             installmentNo: inst.installmentNo,
//             dueDate: inst.dueDate,
//             amount: inst.totalPayable,
//             status: inst.status,
//           });
//         });
//       });
//     });

//     // Step 3: Apply optional date filtering
//     if (dueDateFrom || dueDateTo) {
//       const from = dueDateFrom ? new Date(dueDateFrom) : null;
//       const to = dueDateTo ? new Date(dueDateTo) : null;

//       installmentsList = installmentsList.filter((item) => {
//         const due = new Date(item.dueDate);

//         if (from && due < from) return false;
//         if (to && due > to) return false;

//         return true;
//       });
//     }

//     // Step 4: Pagination after filtering (always applied)
//     const total = installmentsList.length;
//     const pageCount = Math.ceil(total / pageSize);

//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;

//     const paginatedData = installmentsList.slice(start, end);

//     // Step 5: Return final result
//     return res.status(200).json({
//       success: true,
//       data: paginatedData,
//       meta: {
//         page,
//         pageSize,
//         pageCount,
//         total,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching installment payments:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// controllers/studentController.js
// import Student from "../models/Student.js";
// import mongoose from "mongoose";

// export const getStudentById = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid student ID",
//       });
//     }

//     // Ensure franchise is logged in
//     const franchiseId = req.user?.franchiseId;
//     if (!franchiseId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized: Franchise ID missing",
//       });
//     }

//     // Fetch the student only if franchiseId matches
//     const student = await Student.findOne({
//       _id: studentId,
//       franchiseId: franchiseId, // 🔐 Ensures ownership
//     });

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found or unauthorized access",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: student,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching student:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// controllers/paymentController.js
// const Student = require("../models/Student");

export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate studentId
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid student ID is required",
      });
    }

    // Find student by ID
    const student = await Student.findById(studentId).select(
      "name phone email courses payment"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get the first payment (assuming one payment per student for now)
    const payment = student.payment[0];

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No payment information found for this student",
      });
    }

    // Calculate payment summary
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;
    let totalOverdueAmount = 0;

    // Process paidHistory into transactions
    const transactions = payment.paidHistory.map((history, index) => {
      totalPaidAmount += history.paidAmount;

      return {
        id: index + 1,
        date: history.paidDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        amount: history.paidAmount,
        method: history.method,
        status: history.status.toLowerCase(), // "completed", "pending", "failed"
        installmentNo: history.installmentNo,
      };
    });

    // Process installments
    const installments = payment.installments.map((inst) => {
      let status = inst.status;
      const today = new Date();
      const dueDate = new Date(inst.dueDate);

      // If pending and overdue, mark as overdue
      if (status === "pending" && dueDate < today) {
        status = "overdue";
      }

      // Calculate pending amount
      if (status === "pending" || status === "overdue") {
        totalPendingAmount += inst.totalPayable;
        if (status === "overdue") {
          totalOverdueAmount += inst.totalPayable;
        }
      }

      return {
        id: inst.installmentNo,
        dueDate: inst.dueDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        amount: inst.totalPayable,
        status: status,
        paidDate: inst.paidDate
          ? inst.paidDate.toISOString().split("T")[0]
          : null,
        originalAmount: inst.originalAmount,
        franchiseDiscount: inst.franchiseDiscount,
        gstAmount: inst.gstAmount,
        finalAmount: inst.finalAmount,
        paidAmount: inst.paidAmount,
      };
    });

    // Sort installments by due date
    installments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Calculate overdue installments
    const overdueInstallments = installments.filter(
      (inst) => inst.status === "overdue"
    ).length;

    // Format the response
    const response = {
      success: true,
      data: {
        // Student basic info
        student: {
          id: student._id,
          name: student.name,
          phone: student.phone,
          email: student.email,
          courseName: student.courses[0]?.name || "Not Enrolled",
          courseId: student.courses[0]?.id,
        },

        // Payment summary
        paymentSummary: {
          totalAmount: payment.finalFee,
          paidAmount: totalPaidAmount,
          pendingAmount: totalPendingAmount,
          overdueAmount: totalOverdueAmount,
          discount: payment.discount,
          gst: payment.gst,
          originalFee: payment.totalFee,
          paidPercentage: Math.round(
            (totalPaidAmount / payment.finalFee) * 100
          ),
          pendingPercentage: Math.round(
            (totalPendingAmount / payment.finalFee) * 100
          ),
          totalInstallments: payment.installments.length,
          completedInstallments: installments.filter(
            (inst) => inst.status === "paid"
          ).length,
          pendingInstallments: installments.filter(
            (inst) => inst.status === "pending"
          ).length,
          overdueInstallments: overdueInstallments,
        },

        // Transactions (from paidHistory)
        transactions: transactions,

        // Installments
        installments: installments,

        // Payment details
        paymentDetails: {
          totalFee: payment.totalFee,
          discount: payment.discount,
          gst: payment.gst,
          finalFee: payment.finalFee,
          installmentPlan: `${payment.installments.length} installments`,
          paymentId: payment._id,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
