require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grocery_auth';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforgroceryhub';

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Auth Service connected to MongoDB');
    await seedAdminUser();
  })
  .catch(err => console.error('MongoDB connection error in Auth Service:', err));

// Seed Admin user helper
async function seedAdminUser() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password100', 10);
      const admin = new User({
        username: 'admin',
        email: 'admin@groceryhub.com',
        password: hashedPassword,
        name: 'GroceryHub Admin',
        role: 'admin',
        phone: '1234567890',
        address: 'GroceryHub HQ, Sector 5, Admin Suite 1'
      });
      await admin.save();
      console.log('Admin user seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Routes
// 1. Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'auth-service' });
});

// 2. Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name, phone, address, role } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      name,
      phone: phone || '',
      address: address || '',
      role: (role === 'driver' || role === 'vendor' || role === 'user') ? role : 'user'
    });

    await newUser.save();

    // Create JWT Token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role, isApproved: newUser.isApproved },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        address: newUser.address,
        isApproved: newUser.isApproved
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 3. Login User (Admin / Regular User)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for hardcoded admin login
    if (username === 'admin' && password === 'password100') {
      let adminUser = await User.findOne({ username: 'admin' });
      if (!adminUser) {
        // Fallback check if seed didn't finish or failed
        const hashedPassword = await bcrypt.hash('password100', 10);
        adminUser = new User({
          username: 'admin',
          email: 'admin@groceryhub.com',
          password: hashedPassword,
          name: 'GroceryHub Admin',
          role: 'admin'
        });
        await adminUser.save();
      }

      const token = jwt.sign(
        { id: adminUser._id, username: 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: adminUser._id,
          username: 'admin',
          email: adminUser.email,
          name: adminUser.name,
          role: 'admin',
          phone: adminUser.phone,
          address: adminUser.address
        }
      });
    }

    // Normal User Login
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, isApproved: user.isApproved },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 4. Get Current User profile (using JWT middleware)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the approval status in token is different from DB
    if (decoded.isApproved !== user.isApproved) {
      const newToken = jwt.sign(
        { id: user._id, username: user.username, role: user.role, isApproved: user.isApproved },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.setHeader('X-New-Token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-New-Token');
    }

    res.json(user);
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// 5. Get registered drivers (Admin only)
app.get('/api/auth/drivers', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (error) {
    console.error('Fetch drivers error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 6. Get registered vendors (Admin only)
app.get('/api/auth/vendors', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const vendors = await User.find({ role: 'vendor' }).select('-password');
    res.json(vendors);
  } catch (error) {
    console.error('Fetch vendors error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 7. Approve vendor account (Admin only)
app.put('/api/auth/vendors/:id/approve', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'vendor' },
      { $set: { isApproved: true } },
      { new: true }
    ).select('-password');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
