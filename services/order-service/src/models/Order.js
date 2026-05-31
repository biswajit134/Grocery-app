const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  shippingDetails: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    deliverySlot: { type: String, required: true }
  },
  items: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      image: { type: String, required: true },
      vendorId: { type: String, default: null },
      vendorName: { type: String, default: null },
      vendorAddress: { type: String, default: null },
      vendorApproved: { type: Boolean, default: false }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'card']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  status: {
    type: String,
    required: true,
    enum: [
      'Pending Admin Validation',
      'Pending Vendor Approval',
      'Pending Driver Assignment',
      'Pending Driver Acceptance',
      'Accepted',
      'Picked Up',
      'Delivered'
    ],
    default: 'Pending Admin Validation'
  },
  assignedDriverId: {
    type: String,
    default: null
  },
  assignedDriverName: {
    type: String,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: [
      'Pending Admin Validation',
      'Pending Vendor Approval',
      'Pending Driver Assignment',
      'Pending Driver Acceptance',
      'Accepted',
      'Picked Up',
      'Delivered'
    ],
    default: 'Pending Admin Validation'
  },
  couponCode: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  isDriverRated: {
    type: Boolean,
    default: false
  },
  ratedItems: [
    {
      productId: { type: String }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
