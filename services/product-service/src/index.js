require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const redis = require('redis');
const Product = require('./models/Product');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforgroceryhub';

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
    console.error('Auth middleware error in Product Service:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};


const app = express();
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grocery_products';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Middleware
app.use(express.json());
app.use(cors());

// Redis setup with fallback behavior
let redisClient;
let redisConnected = false;

(async () => {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => {
      console.warn('Redis client error, running without cache:', err.message);
      redisConnected = false;
    });
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
      redisConnected = true;
    });
    await redisClient.connect();
  } catch (error) {
    console.warn('Could not initialize Redis client, caching disabled:', error.message);
  }
})();

// Database connection & Seeding
async function connectDB() {
  const connectionStrings = [
    MONGO_URI,
    MONGO_URI.replace('mongodb://mongodb:', 'mongodb://localhost:')
  ].filter(Boolean);

  let connected = false;
  for (const uri of connectionStrings) {
    try {
      console.log(`Attempting to connect to MongoDB: ${uri}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log('Product Service connected to MongoDB successfully!');
      connected = true;
      break;
    } catch (err) {
      console.warn(`Connection attempt failed for ${uri}:`, err.message);
    }
  }

  if (connected) {
    await seedDefaultProducts();
  } else {
    console.error('All database connection strategies failed in Product Service.');
  }
}
connectDB();

const DEFAULT_PRODUCTS = [
  // Vegetables
  {
    name: 'Organic Spinach',
    category: 'vegetables',
    price: 2.99,
    unit: '250g',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600',
    stock: 25,
    description: 'Fresh, nutrient-dense organic spinach leaves. Pre-washed and ready to cook or use in salads.',
    rating: 4.8,
    nutrition: { calories: '23 kcal', protein: '2.9g', carbs: '3.6g' }
  },
  {
    name: 'Fresh Broccoli',
    category: 'vegetables',
    price: 3.49,
    unit: '500g',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600',
    stock: 18,
    description: 'Crisp green broccoli crowns, packed with vitamin C and dietary fiber. Ideal for steaming or roasting.',
    rating: 4.6,
    nutrition: { calories: '34 kcal', protein: '2.8g', carbs: '7g' }
  },
  {
    name: 'Roma Tomatoes',
    category: 'vegetables',
    price: 1.99,
    unit: '1kg',
    image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600',
    stock: 4, // low stock for inventory alert testing
    description: 'Plump and juicy red Roma tomatoes, perfect for fresh sauces, salads, and slicing.',
    rating: 4.5,
    nutrition: { calories: '18 kcal', protein: '0.9g', carbs: '3.9g' }
  },
  {
    name: 'Organic Carrots',
    category: 'vegetables',
    price: 2.49,
    unit: '1kg',
    image: 'https://images.unsplash.com/photo-1598170845058-32b996a6c47b?auto=format&fit=crop&q=80&w=600',
    stock: 30,
    description: 'Sweet and crunchy organic orange carrots. Perfect for snacks, soups, and roasting.',
    rating: 4.7,
    nutrition: { calories: '41 kcal', protein: '0.9g', carbs: '9.6g' }
  },

  // Fruits
  {
    name: 'Honeycrisp Apples',
    category: 'fruits',
    price: 4.99,
    unit: '1kg',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600',
    stock: 22,
    description: 'Exceptionally crisp and sweet Honeycrisp apples, freshly picked and full of juice.',
    rating: 4.9,
    nutrition: { calories: '52 kcal', protein: '0.3g', carbs: '14g' }
  },
  {
    name: 'Organic Bananas',
    category: 'fruits',
    price: 1.89,
    unit: '1 Bunch',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600',
    stock: 45,
    description: 'Sweet, creamy, and high in potassium. Ideal for a healthy snack or smoothies.',
    rating: 4.7,
    nutrition: { calories: '89 kcal', protein: '1.1g', carbs: '23g' }
  },
  {
    name: 'Fresh Blueberries',
    category: 'fruits',
    price: 3.99,
    unit: '125g',
    image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=600',
    stock: 3, // low stock for alert testing
    description: 'Plump, antioxidant-rich fresh blueberries. Great for oatmeal, baking, or eating fresh.',
    rating: 4.8,
    nutrition: { calories: '57 kcal', protein: '0.7g', carbs: '14g' }
  },

  // Spices
  {
    name: 'Organic Turmeric Powder',
    category: 'spices',
    price: 3.29,
    unit: '100g',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
    stock: 40,
    description: 'Pure, aromatic ground turmeric root. Known for its warm, earthy flavor and antioxidant benefits.',
    rating: 4.9,
    nutrition: { calories: '354 kcal', protein: '7.8g', carbs: '65g' }
  },
  {
    name: 'Whole Cardamom Pods',
    category: 'spices',
    price: 5.49,
    unit: '50g',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    description: 'Fragrant and intense green cardamom pods, perfect for both sweet and savory Indian dishes.',
    rating: 4.8,
    nutrition: { calories: '311 kcal', protein: '11g', carbs: '68g' }
  },
  {
    name: 'Ground Black Pepper',
    category: 'spices',
    price: 2.79,
    unit: '100g',
    image: 'https://images.unsplash.com/photo-1508747703725-7197771375e0?auto=format&fit=crop&q=80&w=600',
    stock: 35,
    description: 'Finely ground black pepper corn. Adds a sharp, pungent bite to any culinary creation.',
    rating: 4.6,
    nutrition: { calories: '251 kcal', protein: '10g', carbs: '64g' }
  },

  // Meat
  {
    name: 'Boneless Chicken Breast',
    category: 'meat',
    price: 8.99,
    unit: '1kg',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=600',
    stock: 12,
    description: 'Lean and tender skinless, boneless chicken breasts. Highly versatile for grilling or baking.',
    rating: 4.7,
    nutrition: { calories: '165 kcal', protein: '31g', carbs: '0g' }
  },
  {
    name: 'Premium Ribeye Steak',
    category: 'meat',
    price: 24.99,
    unit: '500g',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    stock: 8,
    description: 'Richly marbled, juicy Angus beef ribeye steak. Thick-cut and perfect for pan-searing or grilling.',
    rating: 4.9,
    nutrition: { calories: '291 kcal', protein: '24g', carbs: '0g' }
  },
  {
    name: 'Lean Ground Turkey',
    category: 'meat',
    price: 6.49,
    unit: '500g',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600',
    stock: 2, // low stock for alert testing
    description: 'Lean ground turkey breast. A great, light alternative for burgers, tacos, and meatballs.',
    rating: 4.5,
    nutrition: { calories: '148 kcal', protein: '22g', carbs: '0g' }
  },
  // Bakery
  {
    name: 'Artisanal Sourdough Bread',
    category: 'bakery',
    price: 4.49,
    unit: '1 Loaf',
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    description: 'Freshly baked artisanal sourdough bread with a crispy crust and soft, airy interior. Naturally fermented.',
    rating: 4.8,
    nutrition: { calories: '250 kcal', protein: '8g', carbs: '50g' }
  },
  {
    name: 'Chocolate Croissant',
    category: 'bakery',
    price: 2.99,
    unit: '2 Pack',
    image: 'https://images.unsplash.com/photo-1549778398-f3837243c81d?auto=format&fit=crop&q=80&w=600',
    stock: 10,
    description: 'Flaky, buttery French puff pastry rolls filled with rich dark chocolate batons. Baked fresh daily.',
    rating: 4.7,
    nutrition: { calories: '340 kcal', protein: '5g', carbs: '38g' }
  },
  {
    name: 'Fresh Blueberry Muffins',
    category: 'bakery',
    price: 3.99,
    unit: '4 Pack',
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=600',
    stock: 3,
    description: 'Moist and cake-like bakery muffins loaded with sweet, juicy fresh blueberries and topped with sugar crystals.',
    rating: 4.6,
    nutrition: { calories: '280 kcal', protein: '4g', carbs: '44g' }
  }
];

async function seedDefaultProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(DEFAULT_PRODUCTS);
      console.log('Default products seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

// Cache helper: clear product-related redis cache keys
async function clearProductsCache() {
  if (!redisConnected) return;
  try {
    const keysToDelete = [
      'products:all',
      'products:category:vegetables',
      'products:category:fruits',
      'products:category:spices',
      'products:category:meat',
      'products:category:bakery'
    ];
    await redisClient.del(keysToDelete);
    console.log('Redis products cache cleared');
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
  }
}

// Routes
// 1. Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'product-service', redis: redisConnected ? 'CONNECTED' : 'DISCONNECTED' });
});

// 2. Get all products (with category filter and caching)
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, vendorId } = req.query;
    
    // Caching is active ONLY if Redis is connected and we are not doing a text search or filtering by vendor
    const cacheKey = category ? `products:category:${category}` : 'products:all';
    
    if (redisConnected && !search && !vendorId) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }
    }

    // Build DB Query
    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (vendorId) {
      query.vendorId = vendorId;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Cache results if Redis is connected and this isn't a search or vendor query
    if (redisConnected && !search && !vendorId) {
      await redisClient.set(cacheKey, JSON.stringify(products), { EX: 3600 }); // Cache for 1 hour
      console.log(`Cache miss. Set cache for key: ${cacheKey}`);
    }

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 3. Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get single product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 4. Create Product (Admin or Approved Vendor)
app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const { name, category, price, unit, image, stock, description, rating, nutrition, discountPrice } = req.body;

    if (!name || !category || !price || !unit || !image || !description) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Enforce role authorization
    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Authorized users only.' });
    }

    // Enforce vendor approval
    if (req.user.role === 'vendor' && !req.user.isApproved) {
      return res.status(403).json({ message: 'Access denied. Vendor account is pending admin verification.' });
    }

    const productPayload = {
      name,
      category,
      price,
      unit,
      image,
      stock: stock || 0,
      description,
      rating: rating || 4.5,
      nutrition: nutrition || { calories: 'N/A', protein: 'N/A', carbs: 'N/A' },
      discountPrice: discountPrice !== undefined ? discountPrice : null
    };

    if (req.user.role === 'vendor') {
      productPayload.vendorId = req.user.id;
      productPayload.vendorName = req.user.username;
    } else {
      productPayload.vendorId = req.body.vendorId || null;
      productPayload.vendorName = req.body.vendorName || null;
    }

    const newProduct = new Product(productPayload);
    await newProduct.save();
    
    // Invalidate Redis cache
    await clearProductsCache();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 5. Update Product (Admin or Product Owner Vendor or Stock Update)
app.put('/api/products/:id', async (req, res) => {
  try {
    const isStockOnly = Object.keys(req.body).length === 1 && req.body.stock !== undefined;

    if (!isStockOnly) {
      // Execute authMiddleware logic inline for normal product updates
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Enforce role authorization
      if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
        return res.status(403).json({ message: 'Access denied. Authorized users only.' });
      }

      // Enforce owner check / approval for vendors
      if (req.user.role === 'vendor') {
        if (!req.user.isApproved) {
          return res.status(403).json({ message: 'Access denied. Vendor account is pending verification.' });
        }
        if (product.vendorId !== req.user.id) {
          return res.status(403).json({ message: 'Access denied. You do not own this product.' });
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Invalidate Redis cache
    await clearProductsCache();

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 6. Delete Product (Admin or Product Owner Vendor)
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Enforce role authorization
    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Authorized users only.' });
    }

    // Enforce owner check / approval for vendors
    if (req.user.role === 'vendor') {
      if (!req.user.isApproved) {
        return res.status(403).json({ message: 'Access denied. Vendor account is pending verification.' });
      }
      if (product.vendorId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this product.' });
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Invalidate Redis cache
    await clearProductsCache();

    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Submit review for product
app.post('/api/products/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.reviews) product.reviews = [];
    product.reviews.push({ username: req.user.username, rating: Number(rating), comment, createdAt: new Date() });

    product.reviewCount = product.reviews.length;
    const totalRating = product.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    product.rating = totalRating / product.reviewCount;

    await product.save();

    // Invalidate Redis cache so updated rating/reviews propagate
    await clearProductsCache();

    res.status(201).json(product);
  } catch (error) {
    console.error('Submit product review error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
