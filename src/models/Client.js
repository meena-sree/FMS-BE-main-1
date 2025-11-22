import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    SuperAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    institutionName: {
      type: String,
      required: true,
      trim: true,
    },

    institutionAddress: {
      type: String,
      required: true,
    },

    institutionPhone: {
      type: String,
      required: true,
    },
    logoUrl: { type: String, required: true },

    isActive: { type: Boolean, default: true },
    // ⭐ COMBINED FINANCE OBJECT
    // ⭐ MULTIPLE CITY TIER FINANCE OBJECTS
    franchiseFinance: [
      {
        cityTier: {
          type: Number,
          required: true,
        },

        franchiseFee: {
          type: Number,
          required: true,
          min: 0,
        },

        depositAmount: {
          type: Number,
          required: true,
          min: 0,
        },

        extraCharges: {
          type: Number,
          default: 0,
          min: 0,
        },

        yearlyRenewalFee: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

    // ⭐ ADDED COURSES + SUBCOURSES WITH FEE STRUCTURE
    courses: [
      {
        courseName: { type: String, required: true },

        subCourses: [
          {
            subCourseName: { type: String, required: true },
            fee: {
              type: Number,
              // required: true,
              min: 0,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Client", clientSchema);

// ++++++++++++++++++++++++++++++++++++++++++++++++++++
// {
//   "SuperAdminId": "65b8396c2e3a1f001c9a0c8b",
//   "institutionName": "Pinnacle Training Solutions",
//   "institutionAddress": "707 Corporate Tower, Financial District, 500032",
//   "institutionPhone": "+91-7788990011",
//   "logoUrl": "https://example.com/logos/pinnacle.png",
//   "isActive": true,
//   "franchiseFinance": {
//     "cityTier": 2,
//     "franchiseFee": 150000,
//     "depositAmount": 50000,
//     "extraCharges": 15000,
//     "yearlyRenewalFee": 10000
//   },
//   "courses": [
//     {
//       "courseName": "Data Science",
//       "subCourses": [
//         {
//           "subCourseName": "Python for Data Analysis",
//           "fee": 35000
//         },
//         {
//           "subCourseName": "Machine Learning Fundamentals",
//           "fee": 60000
//         }
//       ]
//     },
//     {
//       "courseName": "Cloud Computing",
//       "subCourses": [
//         {
//           "subCourseName": "AWS Certified Solutions Architect",
//           "fee": 40000
//         }
//       ]
//     }
//   ]
// }

// {
//   "franchiseFinance": [
//     {
//       "cityTier": 1,
//       "franchiseFee": 50000,
//       "depositAmount": 20000,
//       "extraCharges": 0,
//       "yearlyRenewalFee": 10000
//     },
//     {
//       "cityTier": 2,
//       "franchiseFee": 45000,
//       "depositAmount": 15000,
//       "extraCharges": 2000,
//       "yearlyRenewalFee": 9000
//     }
//   ]
// }
