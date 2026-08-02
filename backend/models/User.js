const mongoose = require('mongoose');

// Ye User schema hai
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true }); // createdAt and updatedAt automatic aayega

module.exports = mongoose.model('User', userSchema);
