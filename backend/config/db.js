const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please ensure MongoDB is running locally or specify a valid MONGO_URI in backend/.env');
    // Allow server to run even if Mongo connection initially fails, or log warning
  }
};

module.exports = connectDB;
