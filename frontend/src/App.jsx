import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import { 
  Leaf, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Truck,
  Heart,
  Download,
  Navigation
} from 'lucide-react';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5001/api/auth';
const PRODUCT_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:5002/api/products';
const ORDER_URL = import.meta.env.VITE_ORDER_URL || 'http://localhost:5003/api/orders';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [activeView, setActiveView] = useState('home'); // 'home', 'shop', 'admin', 'orders'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // App Core States
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Modal / Drawer Toggles
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselItems = [
    {
      title: "Organic Harvest Vegetables",
      subtitle: "FRESH & PESTICIDE FREE",
      desc: "Vetted to meet strict organic standards. Hand-picked at dawn, delivered directly to your doorstep by evening to preserve nutrients and crisp freshness.",
      img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=1200",
      category: "vegetables"
    },
    {
      title: "Sweet Summer Fruits Selection",
      subtitle: "100% ORGANIC & SUN-RIPENED",
      desc: "Succulent honeycrisp apples, wild blueberries, and fresh organic citrus fruits packed with antioxidants. Pure nature's candy.",
      img: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=1200",
      category: "fruits"
    },
    {
      title: "Artisanal Spices & Herbs",
      subtitle: "FRAGRANT & EXOTIC",
      desc: "Elevate your home cooking with premium whole turmeric, hand-selected cardamom pods, and crushed black pepper sourced from heritage spice gardens.",
      img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200",
      category: "spices"
    },
    {
      title: "Premium Pasture Meat Cuts",
      subtitle: "CERTIFIED FRESH & DELICATED",
      desc: "Exquisite cuts of grass-fed Angus ribeye, organic chicken breasts, and farm-fresh deli meats. Properly aged and temperature-controlled.",
      img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=1200",
      category: "meat"
    }
  ];

  // Auto-advance hero carousel
  useEffect(() => {
    if (activeView === 'home') {
      const timer = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeView]);

  // Reset category filters when navigating home to ensure rails load correctly
  useEffect(() => {
    if (activeView === 'home') {
      setSelectedCategory('all');
      setSearchQuery('');
    }
  }, [activeView]);

  // Group products by category in-memory for the home rails
  const vegProducts = products.filter(p => p.category === 'vegetables');
  const fruitProducts = products.filter(p => p.category === 'fruits');
  const spiceProducts = products.filter(p => p.category === 'spices');
  const meatProducts = products.filter(p => p.category === 'meat');
  const bakeryProducts = products.filter(p => p.category === 'bakery');

  // Sync theme
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Load user profile if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  }, [token]);

  // Load products catalog
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Load and poll orders when user is authenticated
  useEffect(() => {
    if (currentUser && token) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, token]);

  // API Call: Fetch User Profile
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        // Token expired or invalid
        setToken('');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // API Call: Fetch Products
  const fetchProducts = async () => {
    try {
      let url = `${PRODUCT_URL}`;
      const params = [];
      if (selectedCategory && selectedCategory !== 'all') {
        params.push(`category=${selectedCategory}`);
      }
      if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // API Call: Fetch Orders (User's own)
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const endpoint = `${ORDER_URL}/my-orders`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Auth Operations
  const handleLogin = async (username, password) => {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Login failed');
    }

    const data = await res.json();
    setToken(data.token);
    setCurrentUser(data.user);
  };

  const handleRegister = async (registrationData) => {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Registration failed');
    }

    const data = await res.json();
    setToken(data.token);
    setCurrentUser(data.user);
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setOrders([]);
    setActiveView('home');
  };

  // Shopping Cart Operations
  const handleAddToCart = (product, qty = 1) => {
    const existingItem = cart.find(item => item.productId === (product._id || product.id));
    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > product.stock) {
        alert(`Cannot add more. Only ${product.stock} units are in stock.`);
        return;
      }
      setCart(cart.map(item => 
        item.productId === (product._id || product.id)
          ? { ...item, quantity: newQty }
          : item
      ));
    } else {
      if (qty > product.stock) {
        alert(`Cannot add. Only ${product.stock} units are in stock.`);
        return;
      }
      const itemPrice = (product.discountPrice !== null && product.discountPrice !== undefined) ? product.discountPrice : product.price;
      setCart([...cart, {
        productId: product._id || product.id,
        name: product.name,
        price: itemPrice,
        quantity: qty,
        unit: product.unit,
        image: product.image
      }]);
    }
  };

  const handleUpdateCartQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    
    // Check stock level
    const originalProduct = products.find(p => (p._id || p.id) === productId);
    if (originalProduct && newQty > originalProduct.stock) {
      alert(`Only ${originalProduct.stock} items are in stock.`);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const handleRemoveCartItem = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleCheckoutClick = () => {
    if (!currentUser) {
      setAuthOpen(true);
    } else {
      setCartOpen(false);
      setCheckoutOpen(true);
    }
  };

  // Order Submission (Deducts stock in DB and posts to order table)
  const handleSubmitOrder = async (orderData) => {
    if (!token) throw new Error('Authorization required to place order.');

    const res = await fetch(`${ORDER_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Checkout failed');
    }

    const completedOrder = await res.json();
    
    // Reset Cart
    setCart([]);
    // Refresh products catalog
    fetchProducts();
    // Refresh orders to sync history
    fetchOrders();
    
    return completedOrder;
  };

  return (
    <div className="app-container">
      {/* Immersive Floating Background Orbs */}
      <div className="background-orb orb-1"></div>
      <div className="background-orb orb-2"></div>
      
      {/* IMMERSIVE SIDEBAR NAVBAR */}
      <Header 
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        currentUser={currentUser}
        logout={handleLogout}
        openAuthModal={() => setAuthOpen(true)}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        toggleCart={() => setCartOpen(!cartOpen)}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* MAIN BODY CONTENTS */}
      <div className="main-content">
        <main style={{ flexGrow: 1 }}>
          
          {/* VIEW 1: LANDING / HOME PAGE */}
          {activeView === 'home' && (
            <div className="animate-fade-in">
              {/* Cinematic Hero Carousel Banner */}
              <section className="hero-carousel">
                {carouselItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`carousel-slide ${idx === carouselIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${item.img})` }}
                  >
                    <div className="carousel-overlay"></div>
                    <div className="carousel-content animate-fade-in">
                      <span className="category-badge vegetables" style={{ marginBottom: '16px', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                        {item.subtitle}
                      </span>
                      <h1 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                        fontWeight: 850,
                        lineHeight: '1.2',
                        marginBottom: '14px',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.02em',
                        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}>
                        {item.title}
                      </h1>
                      <p style={{
                        color: '#cbd5e1',
                        fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
                        marginBottom: '24px',
                        lineHeight: '1.5',
                        maxWidth: '480px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                      }}>
                        {item.desc}
                      </p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => { setSelectedCategory(item.category); setActiveView('shop'); }}
                          className="btn btn-primary"
                          style={{ padding: '10px 20px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)', fontSize: '0.9rem' }}
                        >
                          Shop Collection <ArrowRight size={16} />
                        </button>
                        <button 
                          onClick={() => { setSelectedCategory('all'); setActiveView('shop'); }}
                          className="btn btn-secondary"
                          style={{ padding: '10px 20px', borderRadius: '12px', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '0.9rem' }}
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Carousel Manual Control Overlay Buttons */}
                <button 
                  className="tray-nav-btn left" 
                  style={{ opacity: 1, left: '20px', display: 'flex' }}
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)}
                >
                  ‹
                </button>
                <button 
                  className="tray-nav-btn right" 
                  style={{ opacity: 1, right: '20px', display: 'flex' }}
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselItems.length)}
                >
                  ›
                </button>

                <div className="carousel-indicators">
                  {carouselItems.map((_, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`carousel-indicator ${idx === carouselIndex ? 'active' : ''}`}
                    ></div>
                  ))}
                </div>
              </section>

              {/* Horizontal Category Trays (Rails) */}
              <section style={{ paddingBottom: '40px' }}>
                
                {/* 1. Vegetables Tray */}
                {vegProducts.length > 0 && (
                  <div className="tray-section">
                    <h2 className="tray-title">
                      <Sparkles size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> Fresh Vegetables
                    </h2>
                    <button 
                      className="tray-nav-btn left"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft -= 320;
                      }}
                    >
                      ‹
                    </button>
                    <button 
                      className="tray-nav-btn right"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft += 320;
                      }}
                    >
                      ›
                    </button>
                    <div className="tray-rail">
                      {vegProducts.map(product => (
                        <div key={product._id || product.id} className="tray-card-wrapper">
                          <ProductCard 
                            product={product}
                            onAddToCart={handleAddToCart}
                            onViewDetails={setSelectedProduct}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Fruits Tray */}
                {fruitProducts.length > 0 && (
                  <div className="tray-section">
                    <h2 className="tray-title">
                      <Sparkles size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> Organic Fruits
                    </h2>
                    <button 
                      className="tray-nav-btn left"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft -= 320;
                      }}
                    >
                      ‹
                    </button>
                    <button 
                      className="tray-nav-btn right"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft += 320;
                      }}
                    >
                      ›
                    </button>
                    <div className="tray-rail">
                      {fruitProducts.map(product => (
                        <div key={product._id || product.id} className="tray-card-wrapper">
                          <ProductCard 
                            product={product}
                            onAddToCart={handleAddToCart}
                            onViewDetails={setSelectedProduct}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Spices Tray */}
                {spiceProducts.length > 0 && (
                  <div className="tray-section">
                    <h2 className="tray-title">
                      <Sparkles size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> Fragrant Spices
                    </h2>
                    <button 
                      className="tray-nav-btn left"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft -= 320;
                      }}
                    >
                      ‹
                    </button>
                    <button 
                      className="tray-nav-btn right"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft += 320;
                      }}
                    >
                      ›
                    </button>
                    <div className="tray-rail">
                      {spiceProducts.map(product => (
                        <div key={product._id || product.id} className="tray-card-wrapper">
                          <ProductCard 
                            product={product}
                            onAddToCart={handleAddToCart}
                            onViewDetails={setSelectedProduct}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Meat Tray */}
                {meatProducts.length > 0 && (
                  <div className="tray-section">
                    <h2 className="tray-title">
                      <Sparkles size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> Premium Fresh Meats
                    </h2>
                    <button 
                      className="tray-nav-btn left"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft -= 320;
                      }}
                    >
                      ‹
                    </button>
                    <button 
                      className="tray-nav-btn right"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft += 320;
                      }}
                    >
                      ›
                    </button>
                    <div className="tray-rail">
                      {meatProducts.map(product => (
                        <div key={product._id || product.id} className="tray-card-wrapper">
                          <ProductCard 
                            product={product}
                            onAddToCart={handleAddToCart}
                            onViewDetails={setSelectedProduct}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Bakery Tray */}
                {bakeryProducts.length > 0 && (
                  <div className="tray-section">
                    <h2 className="tray-title">
                      <Sparkles size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> Oven Fresh Bakery
                    </h2>
                    <button 
                      className="tray-nav-btn left"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft -= 320;
                      }}
                    >
                      ‹
                    </button>
                    <button 
                      className="tray-nav-btn right"
                      onClick={(e) => {
                        const rail = e.currentTarget.closest('.tray-section').querySelector('.tray-rail');
                        rail.scrollLeft += 320;
                      }}
                    >
                      ›
                    </button>
                    <div className="tray-rail">
                      {bakeryProducts.map(product => (
                        <div key={product._id || product.id} className="tray-card-wrapper">
                          <ProductCard 
                            product={product}
                            onAddToCart={handleAddToCart}
                            onViewDetails={setSelectedProduct}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories Fast Browse */}
                <div style={{ marginTop: '40px', padding: '0 24px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Browse Categories</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.85rem' }}>Jump directly into fresh catalogs</p>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {[
                      { id: 'vegetables', title: 'Fresh Vegetables', img: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=300', desc: 'Spinach, romaine, fresh tomatoes.' },
                      { id: 'fruits', title: 'Sweet Fruits', img: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=300', desc: 'Apples, ripe bananas, wild berries.' },
                      { id: 'spices', title: 'Fragrant Spices', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300', desc: 'Exotic turmeric, whole cardamom.' },
                      { id: 'meat', title: 'Premium Meat', img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=300', desc: 'Angus ribeye, fresh poultry cuts.' }
                    ].map((cat) => (
                      <div 
                        key={cat.id} 
                        onClick={() => { setSelectedCategory(cat.id); setActiveView('shop'); }}
                        className="glass-panel card-glow-hover"
                        style={{
                          borderRadius: '16px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ height: '110px', width: '100%', overflow: 'hidden' }}>
                          <img src={cat.img} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>{cat.title}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{cat.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </section>

              {/* Trust badges footer */}
              <section style={{
                background: 'var(--bg-secondary)',
                padding: '40px 24px',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div className="container" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '30px'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: 'var(--primary)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '10px', borderRadius: '10px', height: 'fit-content' }}>
                      <Leaf size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>100% Organic & Fresh</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        All items are vetted to meet organic farming regulations. We support sustainable farms.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: 'var(--primary)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '10px', borderRadius: '10px', height: 'fit-content' }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Express Logistics</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Delivered in temperature-controlled boxes. Free delivery for all orders exceeding $30!
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: 'var(--primary)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '10px', borderRadius: '10px', height: 'fit-content' }}>
                      <Heart size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Satisfaction Vow</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Not satisfied with freshness? Reach out to support within 24 hours for instant refund processing.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* VIEW 2: PRODUCT LISTING / SHOP PAGE */}
          {activeView === 'shop' && (
            <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
              
              {/* Header info */}
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', textTransform: 'capitalize' }}>
                  {selectedCategory === 'all' ? 'Fresh Catalog' : selectedCategory}
                </h1>
                {searchQuery && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                    Showing matches for "{searchQuery}"
                  </p>
                )}
              </div>

              {/* Catalog Categories Navigation */}
              <div style={{
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                overflowX: 'auto',
                display: 'flex',
                gap: '12px',
                scrollbarWidth: 'none'
              }} className="categories-scrollbar">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'vegetables', label: 'Vegetables' },
                  { id: 'fruits', label: 'Fruits' },
                  { id: 'spices', label: 'Spices' },
                  { id: 'meat', label: 'Meat' },
                  { id: 'bakery', label: 'Bakery' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.25s',
                      backgroundColor: selectedCategory === cat.id 
                        ? 'var(--primary)' 
                        : 'var(--bg-secondary)',
                      color: selectedCategory === cat.id
                        ? '#030b17'
                        : 'var(--text-secondary)',
                      border: selectedCategory === cat.id
                        ? '1px solid var(--primary)'
                        : '1px solid var(--border-color)',
                      boxShadow: selectedCategory === cat.id ? '0 0 10px rgba(0, 210, 255, 0.3)' : 'none'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

            {/* Grid listing */}
            {products.length === 0 ? (
              <div className="flex-center" style={{
                flexDirection: 'column',
                gap: '16px',
                padding: '80px 24px',
                textAlign: 'center'
              }}>
                <ShoppingBag size={48} style={{ color: 'var(--text-muted)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>No Products Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>
                  We couldn't find any products in "{selectedCategory}" matching your criteria. Try adjusting filters or search queries.
                </p>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="btn btn-secondary"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid-products">
                {products.map((product) => (
                  <ProductCard 
                    key={product._id || product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: USER ORDERS PAGE */}
        {activeView === 'orders' && (
          <div className="container animate-fade-in" style={{ padding: '40px 24px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Order Tracking History</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track live orders and view receipts.</p>
            </div>

            {!currentUser ? (
              <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
                <h3>Authorization Required</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '8px 0 16px 0' }}>Please log in to view your previous grocery orders.</p>
                <button onClick={() => setAuthOpen(true)} className="btn btn-primary">Sign In Now</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex-center" style={{ flexDirection: 'column', gap: '16px', padding: '60px 20px', textAlign: 'center' }}>
                <ShoppingBag size={40} style={{ color: 'var(--text-muted)' }} />
                <h3>No Orders Recorded</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '320px' }}>You haven't checked out any orders yet. Add items and checkout to see order records here!</p>
                <button onClick={() => setActiveView('shop')} className="btn btn-primary">Go to Shop</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {orders.map((order) => {
                  if (!order) return null;
                  const orderId = order._id?.toString() || order.id?.toString() || '';
                  const shortId = orderId ? orderId.slice(-8) : 'N/A';
                  return (
                    <div key={orderId} className="glass-panel animate-fade-in" style={{ borderRadius: '16px', padding: '24px' }}>
                      
                      {/* Top Row: ID & Status */}
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>ORDER #{shortId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>

                      <div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: order.status === 'Delivered' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: order.status === 'Delivered' ? '#10b981' : '#f59e0b'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div style={{ marginBottom: '24px', position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '8px',
                        right: '8px',
                        height: '2px',
                        backgroundColor: 'var(--border-color)',
                        zIndex: 1
                      }}></div>

                      {/* State 1: Placed */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}>✓</div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '4px', fontWeight: '600' }}>Placed</span>
                      </div>

                      {/* State 2: Validated */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: !['Pending Admin Validation'].includes(order.status) ? 'var(--primary)' : 'var(--bg-surface)',
                          border: '2px solid',
                          borderColor: !['Pending Admin Validation'].includes(order.status) ? 'var(--primary)' : 'var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}>
                          {!['Pending Admin Validation'].includes(order.status) ? '✓' : ''}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: !['Pending Admin Validation'].includes(order.status) ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px' }}>Validated</span>
                      </div>

                      {/* State 3: Prepared */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: !['Pending Admin Validation', 'Pending Vendor Approval'].includes(order.status) ? 'var(--primary)' : 'var(--bg-surface)',
                          border: '2px solid',
                          borderColor: !['Pending Admin Validation', 'Pending Vendor Approval'].includes(order.status) ? 'var(--primary)' : 'var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}>
                          {!['Pending Admin Validation', 'Pending Vendor Approval'].includes(order.status) ? '✓' : ''}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: !['Pending Admin Validation', 'Pending Vendor Approval'].includes(order.status) ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px' }}>Prepared</span>
                      </div>

                      {/* State 4: Transit */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: ['Picked Up', 'Delivered'].includes(order.status) ? 'var(--primary)' : 'var(--bg-surface)',
                          border: '2px solid',
                          borderColor: ['Picked Up', 'Delivered'].includes(order.status) ? 'var(--primary)' : 'var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}>
                          {['Picked Up', 'Delivered'].includes(order.status) ? '✓' : ''}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: ['Picked Up', 'Delivered'].includes(order.status) ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px' }}>Transit</span>
                      </div>

                      {/* State 5: Delivered */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: order.status === 'Delivered' ? 'var(--primary)' : 'var(--bg-surface)',
                          border: '2px solid',
                          borderColor: order.status === 'Delivered' ? 'var(--primary)' : 'var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}>
                          {order.status === 'Delivered' ? '✓' : ''}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: order.status === 'Delivered' ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px' }}>Delivered</span>
                      </div>
                    </div>

                    {/* Live Transit Tracker simulation widget */}
                    <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Live Delivery Progress Tracker</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                          {order.assignedDriverName ? `Assigned Driver: ${order.assignedDriverName}` : order.status === 'Pending Admin Validation' ? 'Awaiting Validation...' : order.status === 'Pending Vendor Approval' ? 'Awaiting Vendor Preparation...' : 'Assigning Delivery Partner...'}
                        </span>
                      </div>
                      
                      <div className="road-container">
                        <div className="road-line"></div>
                        <div className="road-dot start"></div>
                        
                        {/* Pulse indicator behind the motorcycle */}
                        <div 
                          className="pulse-indicator"
                          style={{ 
                            left: ['Pending Admin Validation', 'Pending Vendor Approval', 'Pending Driver Assignment'].includes(order.status)
                              ? '10%' 
                              : ['Pending Driver Acceptance', 'Accepted'].includes(order.status)
                                ? '45%' 
                                : order.status === 'Picked Up' 
                                  ? '75%' 
                                  : '100%',
                            display: order.status === 'Delivered' ? 'none' : 'block'
                          }}
                        ></div>

                        {/* Active Driver motorcycle icon */}
                        <div 
                          className="motorcycle-icon"
                          style={{ 
                            left: ['Pending Admin Validation', 'Pending Vendor Approval', 'Pending Driver Assignment'].includes(order.status)
                              ? '10%' 
                              : ['Pending Driver Acceptance', 'Accepted'].includes(order.status)
                                ? '45%' 
                                : order.status === 'Picked Up' 
                                  ? '75%' 
                                  : '100%',
                            color: order.status === 'Delivered' ? 'var(--success)' : 'var(--primary)'
                          }}
                        >
                          <Navigation size={18} style={{ transform: 'rotate(90deg)' }} />
                        </div>

                        <div className="road-dot end"></div>
                      </div>
                      <div className="flex-between" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        <span>Warehouse</span>
                        <span>Accepted</span>
                        <span>In Transit</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    {/* Middle Row: Items & Delivery address */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Items ordered</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(order.items || []).map((item, idx) => {
                            if (!item) return null;
                            return (
                              <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>({item.quantity} x {item.unit})</span></span>
                                <span style={{ fontWeight: '500' }}>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Delivery Information</h4>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{order.shippingDetails?.name || 'N/A'}</div>
                          <div>Address: {order.shippingDetails?.address || 'N/A'}</div>
                          <div style={{ color: 'var(--accent)', fontWeight: '500', marginTop: '4px' }}>🕒 Slot: {order.shippingDetails?.deliverySlot || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Total & Download */}
                    <div style={{
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount Paid:</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)', marginLeft: '8px' }}>
                          ${(order.totalAmount || 0).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          ({order.paymentMethod || 'N/A'} • {order.paymentStatus || 'N/A'})
                        </span>
                      </div>

                      {/* Download Receipt Simulation button */}
                      <button
                        onClick={() => {
                          const receiptText = `
========================================
             GROCERYHUB RECEIPT         
========================================
Order ID: ${orderId}
Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
Customer: ${order.customerName || 'N/A'}
Email: ${order.customerEmail || 'N/A'}

SHIPPING DETAILS:
Name: ${order.shippingDetails?.name || 'N/A'}
Phone: ${order.shippingDetails?.phone || 'N/A'}
Address: ${order.shippingDetails?.address || 'N/A'}
Delivery Slot: ${order.shippingDetails?.deliverySlot || 'N/A'}

ITEMS ORDERED:
${(order.items || []).map(item => item ? `- ${item.name} (${item.quantity} x ${item.unit}) : $${((item.price || 0) * (item.quantity || 0)).toFixed(2)}` : '').filter(Boolean).join('\n')}

SUMMARY:
Total Amount Paid: $${(order.totalAmount || 0).toFixed(2)}
Payment Method: ${(order.paymentMethod || '').toUpperCase()}
Payment Status: ${order.paymentStatus || 'N/A'}
Order Status: ${order.status || 'N/A'}

Thank you for shopping at GroceryHub!
========================================
                          `;
                          const element = document.createElement("a");
                          const file = new Blob([receiptText], { type: 'text/plain' });
                          element.href = URL.createObjectURL(file);
                          element.download = `GroceryHub_Receipt_${orderId || 'order'}.txt`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        <Download size={14} /> Download Receipt
                      </button>
                    </div>

                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '40px 24px 20px 24px',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '30px',
            marginBottom: '32px'
          }}>
            <div>
              <div className="flex-center" style={{ gap: '8px', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)',
                  padding: '6px',
                  borderRadius: '8px',
                  color: 'white',
                  display: 'flex'
                }}>
                  <Leaf size={18} />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  GroceryHub
                </span>
              </div>
              <p style={{ maxWidth: '280px', fontSize: '0.8rem', lineHeight: '1.5' }}>
                Online grocery store selling organic vegetables, fruits, hand-crafted spices, and premium fresh meat.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Store Links</span>
              <button onClick={() => { setSelectedCategory('all'); setActiveView('shop'); }} style={{ textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }} className="btn-link">Catalog Shop</button>
              <button onClick={() => { setSelectedCategory('vegetables'); setActiveView('shop'); }} style={{ textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }} className="btn-link">Vegetables</button>
              <button onClick={() => { setSelectedCategory('fruits'); setActiveView('shop'); }} style={{ textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }} className="btn-link">Fruits</button>
              <button onClick={() => { setSelectedCategory('meat'); setActiveView('shop'); }} style={{ textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }} className="btn-link">Fresh Meat</button>
              <button onClick={() => { setSelectedCategory('bakery'); setActiveView('shop'); }} style={{ textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }} className="btn-link">Bakery</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Reach GroceryHub</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}><MapPin size={14} /> Sector 5, Salt Lake, Kolkata, IN</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}><Phone size={14} /> +91 33 2345 6789</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}><Mail size={14} /> support@groceryhub.com</div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', marginBottom: '20px' }} />

          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>© 2026 GroceryHub. All Rights Reserved. Built under MERN Microservice Guidelines.</span>
            <span>Developed by Antigravity Pairing Engine.</span>
          </div>
        </div>
      </footer>
      </div>

      {/* DRAWERS AND OVERLAY MODALS */}
      
      {/* 1. Cart drawer */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckoutClick}
        onStartShopping={() => { setSelectedCategory('all'); setActiveView('shop'); }}
      />

      {/* 2. Authentication modal */}
      <AuthModal 
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* 3. Checkout modal */}
      <CheckoutModal 
        isOpen={checkoutOpen}
        onClose={(success) => {
          setCheckoutOpen(false);
          if (success === true) {
            setActiveView('orders');
          }
        }}
        cartItems={cart}
        currentUser={currentUser}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* 4. Detail modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

    </div>
  );
}

export default App;
