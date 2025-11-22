// import Client from "../models/Client.js";

// export const updateClientByAdmin = async (req, res) => {
//   try {
//     // 1️⃣ Only Admin allowed
//     if (req.user.role !== "Admin") {
//       return res.status(403).json({ message: "Access denied. Admin only." });
//     }

//     // 2️⃣ Admin can only update THEIR OWN client
//     const clientId = req.user.clientId;

//     if (!clientId) {
//       return res.status(400).json({ message: "Admin has no client assigned." });
//     }

//     const {
//       institutionName,
//       institutionAddress,
//       institutionPhone,
//       logoUrl,

//       franchiseFinance, // nested { cityTier, franchiseFee, depositAmount, ... }

//       courses, // full array replacement
//     } = req.body;

//     // 3️⃣ Build dynamic update object
//     let updateData = {};

//     if (institutionName) updateData.institutionName = institutionName;
//     if (institutionAddress) updateData.institutionAddress = institutionAddress;
//     if (institutionPhone) updateData.institutionPhone = institutionPhone;
//     if (logoUrl) updateData.logoUrl = logoUrl;

//     // FINANCE UPDATE (partial support)
//     if (franchiseFinance) {
//       for (const key in franchiseFinance) {
//         updateData[`franchiseFinance.${key}`] = franchiseFinance[key];
//       }
//     }

//     // COURSE UPDATE (array replace)
//     if (courses) {
//       updateData.courses = courses;
//     }

//     // 4️⃣ Update the client document
//     const updatedClient = await Client.findByIdAndUpdate(
//       clientId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     if (!updatedClient) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     res.status(200).json({
//       message: "Client updated successfully",
//       client: updatedClient,
//     });
//   } catch (error) {
//     console.error("Error updating client:", error);
//     res.status(500).json({
//       message: "Server error while updating client",
//       error: error.message,
//     });
//   }
// };

// 📌 Example Request Body (Partial Update Allowed)
// ✔ Update only institution details

// {
//   "institutionPhone": "9876543211",
//   "logoUrl": "/uploads/new-logo.png"
// }

// {
//   "franchiseFinance": {
//     "cityTier": 2,
//     "franchiseFee": 50000,
//     "depositAmount": 20000,
//     "yearlyRenewalFee": 8000
//   }
// }

// {
//   "courses": [
//     {
//       "courseName": "MERN",
//       "subCourses": [
//         { "subCourseName": "React", "fee": 15000 },
//         { "subCourseName": "Node.js", "fee": 12000 }
//       ]
//     }
//   ]
// }

// ⭐ Next Step?

// I can also give you:

// 🔹 Controller to add a new tier
// 🔹 Controller to update a specific tier
// 🔹 Controller to delete a tier

import Client from "../models/Client.js";

export const updateClientByAdmin = async (req, res) => {
  try {
    // 1️⃣ Only Admin allowed
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // 2️⃣ Admin can only update THEIR OWN client
    const clientId = req.user.clientId;

    if (!clientId) {
      return res.status(400).json({ message: "Admin has no client assigned." });
    }

    const {
      institutionName,
      institutionAddress,
      institutionPhone,
      logoUrl,

      franchiseFinance, // FULL ARRAY (not object)
      courses, // FULL ARRAY
    } = req.body;

    // 3️⃣ Build update object dynamically
    let updateData = {};

    if (institutionName) updateData.institutionName = institutionName;
    if (institutionAddress) updateData.institutionAddress = institutionAddress;
    if (institutionPhone) updateData.institutionPhone = institutionPhone;
    if (logoUrl) updateData.logoUrl = logoUrl;

    // 4️⃣ FULL ARRAY REPLACEMENT FOR tiers
    if (Array.isArray(franchiseFinance)) {
      updateData.franchiseFinance = franchiseFinance;
    }

    // 5️⃣ FULL ARRAY REPLACEMENT FOR courses
    if (Array.isArray(courses)) {
      updateData.courses = courses;
    }

    // 6️⃣ Update the client document
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({
      message: "Server error while updating client",
      error: error.message,
    });
  }
};

// ==================================================================
// {
//   "institutionName": "New Institute",
//   "franchiseFinance": [
//     {
//       "cityTier": 1,
//       "franchiseFee": 50000,
//       "depositAmount": 25000,
//       "extraCharges": 0,
//       "yearlyRenewalFee": 0
//     },
//     {
//       "cityTier": 2,
//       "franchiseFee": 45000,
//       "depositAmount": 20000,
//       "extraCharges": 0,
//       "yearlyRenewalFee": 0
//     }
//   ],
//   "courses": [
//     {
//       "courseName": "MERN",
//       "subCourses": [
//         { "subCourseName": "React", "fee": 8000 },
//         { "subCourseName": "Node.js & Express", "fee": 9500 },
//         { "subCourseName": "MongoDB Essentials", "fee": 6500 }
//       ]
//     },
//     {
//       "courseName": "Data Science",
//       "subCourses": [
//         { "subCourseName": "Python Fundamentals", "fee": 7000 },
//         { "subCourseName": "Machine Learning Algorithms", "fee": 12000 }
//       ]
//     },
//     {
//       "courseName": "Cloud Fundamentals",
//       "subCourses": [
//         { "subCourseName": "AWS Cloud Practitioner", "fee": 10000 },
//         { "subCourseName": "Azure Basics", "fee": 9000 }
//       ]
//     }
//   ]}
