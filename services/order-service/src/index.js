require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');


const app = express();
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:admin@localhost:27017/grocery_orders?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforgroceryhub';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Order Service connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error in Order Service:', err));

// Auth Middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin middleware check
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

// Routes
// 1. Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'order-service' });
});

// 2. Create Order (requires authentication)
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { shippingDetails, items, paymentMethod, totalAmount, couponCode } = req.body;

    if (!shippingDetails || !items || items.length === 0 || !paymentMethod || !totalAmount) {
      return res.status(400).json({ message: 'Please provide all details' });
    }

    // Step 2a: Validate stock levels & deduct in Product Service
    // Using simple loop and API requests
    const updatedItems = [];
    for (const item of items) {
      try {
        // Fetch current product from product-service
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${item.productId}`);
        const product = response.data;

        if (!product) {
          return res.status(404).json({ message: `Product ${item.name} not found` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
          });
        }

        // Calculate new stock
        const newStock = product.stock - item.quantity;
        
        // Update product stock in product-service
        await axios.put(`${PRODUCT_SERVICE_URL}/api/products/${item.productId}`, {
          stock: newStock
        });

        // Use discountPrice if active
        const unitPrice = (product.discountPrice !== null && product.discountPrice !== undefined) ? product.discountPrice : product.price;

        let vendorAddress = 'N/A';
        if (product.vendorId) {
          try {
            const authRes = await axios.get(`${AUTH_SERVICE_URL}/api/auth/users/${product.vendorId}`);
            if (authRes.data && authRes.data.address) {
              vendorAddress = authRes.data.address;
            }
          } catch (authErr) {
            console.error(`Failed to fetch vendor address for vendorId ${product.vendorId}:`, authErr.message);
          }
        }

        updatedItems.push({
          productId: item.productId,
          name: item.name,
          price: unitPrice,
          quantity: item.quantity,
          unit: item.unit,
          image: item.image,
          vendorId: product.vendorId || null,
          vendorName: product.vendorName || null,
          vendorAddress: vendorAddress,
          vendorApproved: false
        });

      } catch (productErr) {
        console.error(`Error communicating with Product Service for item ${item.productId}:`, productErr.message);
        return res.status(502).json({ 
          message: `Failed to verify product stock for ${item.name}. Product service might be down.` 
        });
      }
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of updatedItems) {
      subtotal += item.price * item.quantity;
    }

    // Apply coupon if valid
    let discountAmount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid or expired coupon code' });
      }
      if (subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ message: `Minimum order amount of $${coupon.minOrderAmount} required for coupon ${coupon.code}` });
      }
      if (coupon.discountType === 'percent') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      appliedCouponCode = coupon.code;
    }

    const finalTotal = subtotal - discountAmount;

    // Step 2b: Create Order
    const newOrder = new Order({
      userId: req.user.id,
      customerName: req.user.username,
      customerEmail: req.user.email || `${req.user.username}@groceryhub.com`,
      shippingDetails,
      items: updatedItems,
      totalAmount: finalTotal,
      couponCode: appliedCouponCode,
      discountAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'Paid' : 'Pending',
      status: 'Pending Admin Validation',
      deliveryStatus: 'Pending Admin Validation'
    });

    await newOrder.save();
    res.status(201).json(newOrder);

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 3. Get my orders (requires authentication)
app.get('/api/orders/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 4. Get all orders (Admin only)
app.get('/api/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5. Update order status (Admin only)
app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = [
      'Pending Admin Validation',
      'Pending Vendor Approval',
      'Pending Driver Assignment',
      'Pending Driver Acceptance',
      'Accepted',
      'Picked Up',
      'Delivered'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    // If order is delivered and payment is COD, mark it paid
    const updateObj = { status };
    if (status === 'Delivered') {
      const order = await Order.findById(req.params.id);
      if (order && order.paymentMethod === 'cod') {
        updateObj.paymentStatus = 'Paid';
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateObj },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5b. Admin validates request (Admin only)
app.put('/api/orders/:id/validate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'Pending Vendor Approval',
          deliveryStatus: 'Pending Vendor Approval'
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Validate order error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5c. Vendor views their item requests (Vendor only)
app.get('/api/orders/vendor/my-orders', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendors only.' });
    }

    // Find orders that contain at least one item owned by this vendor
    const orders = await Order.find({
      'items.vendorId': req.user.id
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5d. Vendor approves their items (Vendor only)
app.put('/api/orders/:id/vendor-approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendors only.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let updatedAny = false;
    order.items.forEach(item => {
      if (item.vendorId === req.user.id) {
        item.vendorApproved = true;
        updatedAny = true;
      }
    });

    if (!updatedAny) {
      return res.status(400).json({ message: 'No items in this order belong to you.' });
    }

    // Check if ALL items in the order are approved
    const allApproved = order.items.every(item => item.vendorApproved === true);
    if (allApproved) {
      order.status = 'Pending Driver Assignment';
      order.deliveryStatus = 'Pending Driver Assignment';
    } else {
      order.status = 'Pending Vendor Approval';
      order.deliveryStatus = 'Pending Vendor Approval';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Vendor approve order error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 6. Assign driver to order (Admin only)
app.put('/api/orders/:id/assign', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { driverId, driverName } = req.body;
    if (!driverId || !driverName) {
      return res.status(400).json({ message: 'Driver details (driverId, driverName) are required' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          assignedDriverId: driverId,
          assignedDriverName: driverName,
          deliveryStatus: 'Pending Driver Acceptance',
          status: 'Pending Driver Acceptance'
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 6b. Driver accepts delivery request (Driver only)
app.put('/api/orders/:id/driver-accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Access denied. Drivers only.' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      assignedDriverId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to this driver' });
    }

    order.status = 'Accepted';
    order.deliveryStatus = 'Accepted';
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Driver accept order error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 7. Get driver assigned deliveries (Driver only)
app.get('/api/orders/driver/my-deliveries', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Access denied. Drivers only.' });
    }

    const orders = await Order.find({ assignedDriverId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get driver deliveries error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 8. Update delivery status by driver (Driver only)
app.put('/api/orders/:id/driver-status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Access denied. Drivers only.' });
    }

    const { deliveryStatus } = req.body;
    if (!['Picked Up', 'Delivered'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Invalid delivery status. Must be "Picked Up" or "Delivered".' });
    }

    const updateFields = { deliveryStatus };
    if (deliveryStatus === 'Picked Up') {
      updateFields.status = 'Picked Up';
    } else if (deliveryStatus === 'Delivered') {
      updateFields.status = 'Delivered';
      
      // If payment method is COD, mark payment status as Paid upon delivery
      const orderCheck = await Order.findById(req.params.id);
      if (orderCheck && orderCheck.paymentMethod === 'cod') {
        updateFields.paymentStatus = 'Paid';
      }
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, assignedDriverId: req.user.id },
      { $set: updateFields },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to this driver' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 9. Get all coupons (Admin only)
app.get('/api/orders/coupons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 10. Create new coupon (Admin only)
app.post('/api/orders/coupons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, isActive } = req.body;
    if (!code || discountValue === undefined) {
      return res.status(400).json({ message: 'Coupon code and discount value are required' });
    }
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 11. Delete coupon (Admin only)
app.delete('/api/orders/coupons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 12. Validate coupon (Public/Customer)
app.post('/api/orders/coupons/validate', authMiddleware, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code || orderAmount === undefined) {
      return res.status(400).json({ message: 'Coupon code and order amount are required' });
    }
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired coupon code' });
    }
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ valid: false, message: `Minimum order amount of $${coupon.minOrderAmount} required` });
    }
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, orderAmount);
    res.json({
      valid: true,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: orderAmount - discountAmount
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
