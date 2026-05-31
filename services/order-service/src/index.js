require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grocery_orders';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforgroceryhub';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';

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
    const { shippingDetails, items, paymentMethod, totalAmount } = req.body;

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

        updatedItems.push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          image: item.image
        });

      } catch (productErr) {
        console.error(`Error communicating with Product Service for item ${item.productId}:`, productErr.message);
        return res.status(502).json({ 
          message: `Failed to verify product stock for ${item.name}. Product service might be down.` 
        });
      }
    }

    // Step 2b: Create Order
    const newOrder = new Order({
      userId: req.user.id,
      customerName: req.user.username,
      customerEmail: req.user.email || `${req.user.username}@groceryhub.com`,
      shippingDetails,
      items: updatedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'Paid' : 'Pending',
      status: 'Pending'
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

    const validStatuses = ['Pending', 'Packing', 'Out for Delivery', 'Delivered'];
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

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
