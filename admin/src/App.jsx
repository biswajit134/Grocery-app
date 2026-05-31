import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Ticket, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Tag, 
  Package, 
  Users, 
  DollarSign, 
  ClipboardList, 
  AlertTriangle 
} from 'lucide-react';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5001/api/auth';
const PRODUCT_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:5002/api/products';
const ORDER_URL = import.meta.env.VITE_ORDER_URL || 'http://localhost:5003/api/orders';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('admin_user')) || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Modal / Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'vegetables',
    price: '',
    discountPrice: '',
    unit: '1kg',
    image: '',
    stock: '',
    description: '',
    calories: '',
    protein: '',
    carbs: ''
  });

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    minOrderAmount: '',
    isActive: true
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Products
      const prodRes = await fetch(PRODUCT_URL);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Fetch Orders
      const orderRes = await fetch(ORDER_URL, { headers });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData);
      }

      // Fetch Drivers
      const driverRes = await fetch(`${AUTH_URL}/drivers`, { headers });
      if (driverRes.ok) {
        const driverData = await driverRes.json();
        setDrivers(driverData);
      }

      // Fetch Vendors
      const vendorRes = await fetch(`${AUTH_URL}/vendors`, { headers });
      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        setVendors(vendorData);
      }

      // Fetch Coupons
      const couponRes = await fetch(`${ORDER_URL}/coupons`, { headers });
      if (couponRes.ok) {
        const couponData = await couponRes.json();
        setCoupons(couponData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Only administrators are allowed to access this panel.');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setSuccess('Logged in successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  // Vendor actions
  const approveVendor = async (vendorId) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${AUTH_URL}/vendors/${vendorId}/approve`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to approve vendor');
      setSuccess('Vendor approved successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Product Actions
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price),
        discountPrice: productForm.discountPrice ? parseFloat(productForm.discountPrice) : null,
        unit: productForm.unit,
        image: productForm.image,
        stock: parseInt(productForm.stock) || 0,
        description: productForm.description,
        nutrition: {
          calories: productForm.calories || 'N/A',
          protein: productForm.protein || 'N/A',
          carbs: productForm.carbs || 'N/A'
        }
      };

      const url = editingProduct ? `${PRODUCT_URL}/${editingProduct._id}` : PRODUCT_URL;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save product');

      setSuccess(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      setIsProductModalOpen(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${PRODUCT_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete product');
      setSuccess('Product deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: 'vegetables',
      price: '',
      discountPrice: '',
      unit: '1kg',
      image: '',
      stock: '',
      description: '',
      calories: '',
      protein: '',
      carbs: ''
    });
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      discountPrice: prod.discountPrice || '',
      unit: prod.unit,
      image: prod.image,
      stock: prod.stock,
      description: prod.description,
      calories: prod.nutrition?.calories || '',
      protein: prod.nutrition?.protein || '',
      carbs: prod.nutrition?.carbs || ''
    });
    setIsProductModalOpen(true);
  };

  // Coupon Actions
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        code: couponForm.code.toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : 0,
        isActive: couponForm.isActive
      };

      const res = await fetch(`${ORDER_URL}/coupons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create coupon');

      setSuccess('Coupon created successfully!');
      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        discountType: 'percent',
        discountValue: '',
        minOrderAmount: '',
        isActive: true
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${ORDER_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete coupon');
      setSuccess('Coupon deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Order Assignment
  const assignDriver = async (orderId, driverId, driverName) => {
    if (!driverId) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${ORDER_URL}/${orderId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driverId, driverName })
      });
      if (!res.ok) throw new Error('Failed to assign driver');
      setSuccess('Driver assigned successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${ORDER_URL}/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSuccess('Order status updated!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Stat calculations
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeOrders = orders.filter(order => order.status !== 'Delivered').length;
  const outOfStockProducts = products.filter(prod => prod.stock <= 0).length;
  const pendingVendors = vendors.filter(v => !v.isApproved).length;

  if (!token) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #111 0%, #000 100%)', padding: '20px' }}>
        <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '3.5rem' }}>🛡️</span>
            <h1 style={{ marginTop: '16px', color: '#fff', fontSize: '1.8rem' }}>Admin Control Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Sign in to manage GroceryHub platform</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="admin@groceryhub.com"
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label>Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '1rem' }}>
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <span style={{ fontSize: '2rem' }}>🛡️</span>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>GroceryHub</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin Portal</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <ShoppingBag size={20} />
            Catalog & Offers
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Truck size={20} />
            Logistics & Orders
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendors')}
          >
            <ShieldCheck size={20} />
            Vendor Approvals
            {pendingVendors > 0 && (
              <span style={{ marginLeft: 'auto', backgroundColor: 'var(--danger)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '99px', fontWeight: 'bold' }}>
                {pendingVendors}
              </span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <Ticket size={20} />
            Coupon Engine
          </button>
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)' }}>
              <span style={{ fontSize: '1.2rem' }}>👨‍💼</span>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>{user?.username}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System Admin</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ width: '100%', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Banner notices */}
        {error && (
          <div className="glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--danger)', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
            <AlertTriangle color="var(--danger)" size={20} />
            <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginLeft: 'auto', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--success)', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.05)' }}>
            <Check color="var(--success)" size={20} />
            <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{success}</span>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginLeft: 'auto', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div style={{ color: 'var(--primary)', marginBottom: '20px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Refreshing metrics...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* TAB CONTENTS */}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>System Overview</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Platform status, active counts, and recent store activity</p>
            </div>

            <div className="metrics-grid">
              <div className="metric-card glass-panel">
                <div className="metric-icon-wrapper">
                  <DollarSign size={24} />
                </div>
                <div className="metric-info">
                  <h3>Total Revenue</h3>
                  <p>${totalRevenue.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card glass-panel">
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <ClipboardList size={24} />
                </div>
                <div className="metric-info">
                  <h3>Active Orders</h3>
                  <p>{activeOrders}</p>
                </div>
              </div>

              <div className="metric-card glass-panel">
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                  <Package size={24} />
                </div>
                <div className="metric-info">
                  <h3>Out of Stock</h3>
                  <p>{outOfStockProducts}</p>
                </div>
              </div>

              <div className="metric-card glass-panel">
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                  <Users size={24} />
                </div>
                <div className="metric-info">
                  <h3>Pending Vendors</h3>
                  <p>{pendingVendors}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Recent Platform Orders</h2>
                <button className="btn btn-secondary" onClick={fetchData} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>Refresh</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Coupon</th>
                      <th>Status</th>
                      <th>Assigned Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="table-row-hover">
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order._id.substring(order._id.length - 8)}</td>
                        <td>
                          <div>{order.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                        </td>
                        <td style={{ fontWeight: '600' }}>${order.totalAmount.toFixed(2)}</td>
                        <td>
                          {order.couponCode ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', backgroundColor: 'rgba(255,107,0,0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,107,0,0.2)' }}>
                              {order.couponCode}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ color: order.assignedDriverName ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {order.assignedDriverName || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          No orders registered yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>Catalog Manager & Offers</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage store items, set discounted offer prices, and adjust stocks</p>
              </div>
              <button 
                onClick={() => {
                  resetProductForm();
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }} 
                className="btn btn-primary"
              >
                <Plus size={18} />
                Add New Product
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Base Price</th>
                      <th>Offer Price</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod._id} className="table-row-hover">
                        <td style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img src={prod.image} alt={prod.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: '600' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unit: {prod.unit}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`category-badge ${prod.category}`}>
                            {prod.category}
                          </span>
                        </td>
                        <td style={{ textDecoration: prod.discountPrice ? 'line-through' : 'none', color: prod.discountPrice ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          ${prod.price.toFixed(2)}
                        </td>
                        <td style={{ color: 'var(--primary)', fontWeight: '600' }}>
                          {prod.discountPrice !== null && prod.discountPrice !== undefined ? (
                            `$${prod.discountPrice.toFixed(2)}`
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'normal' }}>No Active Offer</span>
                          )}
                        </td>
                        <td>
                          <span style={{ 
                            color: prod.stock <= 5 ? 'var(--danger)' : 'var(--text-primary)',
                            fontWeight: prod.stock <= 5 ? '600' : 'normal'
                          }}>
                            {prod.stock} units
                          </span>
                          {prod.stock <= 5 && <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px' }}>Low Stock</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                              onClick={() => openEditProduct(prod)} 
                              className="btn btn-secondary" 
                              style={{ padding: '8px' }}
                              title="Edit / Set Offer"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => deleteProduct(prod._id)} 
                              className="btn btn-danger" 
                              style={{ padding: '8px' }}
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          No products registered in system
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. LOGISTICS & ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>Logistics & Order Allocation</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Track customer deliveries, update fulfillment stages, and allocate orders to drivers</p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Recipient Details</th>
                      <th>Fulfillment</th>
                      <th>Driver Assignment</th>
                      <th>Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="table-row-hover">
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: '600' }}>#{order._id.substring(order._id.length - 8)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{order.shippingDetails?.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {order.shippingDetails?.phone}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address: {order.shippingDetails?.address}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Slot: {order.shippingDetails?.deliverySlot}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{order.items.length} items</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>${order.totalAmount.toFixed(2)}</div>
                          {order.discountAmount > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Discount: -${order.discountAmount.toFixed(2)}</div>
                          )}
                        </td>
                        <td>
                          {order.assignedDriverId ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                <Truck size={14} color="var(--primary)" />
                                <span>{order.assignedDriverName}</span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Status: {order.deliveryStatus || 'Pending'}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assign a driver:</span>
                              <select 
                                className="form-control" 
                                style={{ padding: '6px', fontSize: '0.85rem', maxWidth: '200px' }}
                                onChange={(e) => {
                                  const selectEl = e.target;
                                  const driverId = selectEl.value;
                                  const driverName = selectEl.options[selectEl.selectedIndex].text;
                                  if (driverId) {
                                    assignDriver(order._id, driverId, driverName);
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Select Driver</option>
                                {drivers.map(drv => (
                                  <option key={drv._id} value={drv._id}>{drv.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td>
                          <select
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.85rem', width: '150px' }}
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Packing">Packing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          No orders placed on platform yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. VENDOR TAB */}
        {activeTab === 'vendors' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>Vendor Verifications</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Review partner credentials and approve new vendor outlets to enable stock updates</p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Email ID</th>
                      <th>Outlet Details</th>
                      <th>Verification Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor._id} className="table-row-hover">
                        <td>
                          <div style={{ fontWeight: '600' }}>{vendor.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Username: {vendor.username}</div>
                        </td>
                        <td>{vendor.email}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{vendor.address || 'Address not supplied'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {vendor.phone || 'N/A'}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${vendor.isApproved ? 'verified' : 'unverified'}`}>
                            {vendor.isApproved ? 'Approved & Verified' : 'Pending Verification'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!vendor.isApproved ? (
                            <button 
                              onClick={() => approveVendor(vendor._id)} 
                              className="btn btn-primary" 
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              Approve Partner
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No Action Required</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {vendors.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          No vendor profiles registered in database
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. COUPON ENGINE TAB */}
        {activeTab === 'coupons' && (
          <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>Coupon Code Engine</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Generate promotional discount codes, manage value rates, and set order thresholds</p>
              </div>
              <button 
                onClick={() => setIsCouponModalOpen(true)} 
                className="btn btn-primary"
              >
                <Plus size={18} />
                Create New Coupon
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Coupon Code</th>
                      <th>Discount Rate / Value</th>
                      <th>Min Order Limit</th>
                      <th>Fulfillment Status</th>
                      <th>Created On</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="table-row-hover">
                        <td style={{ fontWeight: '700', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                          {coupon.code}
                        </td>
                        <td>
                          {coupon.discountType === 'percent' ? (
                            `${coupon.discountValue}% Off`
                          ) : (
                            `$${coupon.discountValue.toFixed(2)} Off`
                          )}
                        </td>
                        <td>
                          ${coupon.minOrderAmount ? coupon.minOrderAmount.toFixed(2) : '0.00'}
                        </td>
                        <td>
                          <span className={`status-badge ${coupon.isActive ? 'verified' : 'unverified'}`}>
                            {coupon.isActive ? 'Active' : 'Expired / Inactive'}
                          </span>
                        </td>
                        <td>{new Date(coupon.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => deleteCoupon(coupon._id)} 
                            className="btn btn-danger" 
                            style={{ padding: '8px' }}
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          No coupons registered in database
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PRODUCT FORM MODAL */}
      {isProductModalOpen && (
        <div className="drawer-overlay flex-center" onClick={() => setIsProductModalOpen(false)}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '650px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>
                {editingProduct ? 'Modify Product Profile' : 'Register New Catalog Product'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={productForm.name} 
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    className="form-control"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    required
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="spices">Spices</option>
                    <option value="meat">Meat</option>
                    <option value="bakery">Bakery</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Original Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    value={productForm.price} 
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Offer Price ($) (Optional)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    placeholder="Slashed Price"
                    value={productForm.discountPrice} 
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Sales Unit *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 500g, 1 Bunch"
                    value={productForm.unit} 
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Image URL *</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    value={productForm.image} 
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Stock Qty *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={productForm.stock} 
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description Details *</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={productForm.description} 
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Nutritional Values</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Calories</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 35 kcal"
                    value={productForm.calories} 
                    onChange={(e) => setProductForm({ ...productForm, calories: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Protein</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 2.4g"
                    value={productForm.protein} 
                    onChange={(e) => setProductForm({ ...productForm, protein: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Carbohydrates</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 7.2g"
                    value={productForm.carbs} 
                    onChange={(e) => setProductForm({ ...productForm, carbs: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON FORM MODAL */}
      {isCouponModalOpen && (
        <div className="drawer-overlay flex-center" onClick={() => setIsCouponModalOpen(false)}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '480px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>
                Generate Promotion Coupon
              </h2>
              <button onClick={() => setIsCouponModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit}>
              <div className="form-group">
                <label>Coupon Code *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. SUMMER25"
                  value={couponForm.code} 
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select 
                    className="form-control"
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    required
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Value ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Rate/Value *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    placeholder={couponForm.discountType === 'percent' ? 'e.g. 20' : 'e.g. 5.00'}
                    value={couponForm.discountValue} 
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Minimum Order Purchase ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  placeholder="e.g. 15.00"
                  value={couponForm.minOrderAmount} 
                  onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', marginBottom: '24px' }}>
                <input 
                  type="checkbox" 
                  id="couponActive"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="couponActive" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-primary)' }}>Make coupon code active immediately</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsCouponModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
