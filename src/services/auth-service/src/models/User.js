const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'driver', 'vendor'],
    default: 'user'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 5.0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      customerName: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      feedback: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
