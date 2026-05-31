const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'spices', 'meat', 'bakery']
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    default: '1kg'
  },
  image: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 4.5
  },
  nutrition: {
    calories: { type: String, default: 'N/A' },
    protein: { type: String, default: 'N/A' },
    carbs: { type: String, default: 'N/A' }
  },
  vendorId: {
    type: String,
    default: null
  },
  vendorName: {
    type: String,
    default: null
  },
  discountPrice: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
