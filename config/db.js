const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return; // Reuse connection across serverless invocations

  if (!process.env.MONGO_URI) {
    console.error('[DB] MONGO_URI is not set. Check Vercel environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    // Do NOT call process.exit(1) — it would crash the Vercel function
    throw error;
  }
};

module.exports = connectDB;
