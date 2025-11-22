import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    throw error; // Let the caller (index.js) handle the error
  }
};

export default connectDB;
