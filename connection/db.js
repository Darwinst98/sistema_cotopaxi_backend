const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const DB_URL = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;