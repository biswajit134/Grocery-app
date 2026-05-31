import React, { useState, useEffect } from 'react';
import { 
  Store, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  ShoppingBag, 
  AlertCircle, 
  Layers, 
  Package, 
  X,
  Sparkles,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5001/api/auth';
const PRODUCT_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:5002/api/products';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('vendorToken') || '');
  const [vendorUser, setVendorUser] = useState(null);
  const [products, setProducts] = useState([]);
  
  // Auth Form States
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add/Edit Product Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('vegetables');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('1kg');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');

  // Fetch Vendor Profile
  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        // Read auto-refreshed token from response headers if present
        const refreshedToken = res.headers.get('X-New-Token');
        if (refreshedToken) {
          setToken(refreshedToken);
          localStorage.setItem('vendorToken', refreshedToken);
        }

        const data = await res.json();
        if (data.role !== 'vendor') {
          setErrorMsg('Access denied. This portal is for vendors only.');
          handleLogout();
          return;
        }
        setVendorUser(data);
        if (data.isApproved) {
          fetchProducts(data._id, refreshedToken || authToken);
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch Vendor Products
  const fetchProducts = async (vendorId, authToken) => {
    try {
      const res = await fetch(`${PRODUCT_URL}?vendorId=${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Sync token and load info
  useEffect(() => {
    if (token) {
      localStorage.setItem('vendorToken', token);
      fetchProfile(token);
    } else {
      localStorage.removeItem('vendorToken');
      setVendorUser(null);
      setProducts([]);
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, email, phone, address, role: 'vendor' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      setToken(data.token);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setVendorUser(null);
    setProducts([]);
    setErrorMsg('');
  };

  // Modal open for adding product
  const openAddModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('vegetables');
    setProdPrice('');
    setProdUnit('1kg');
    setProdStock('');
    setProdImage('');
    setProdDescription('');
    setIsModalOpen(true);
  };

  // Modal open for editing product
  const openEditModal = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdPrice(product.price);
    setProdUnit(product.unit);
    setProdStock(product.stock);
    setProdImage(product.image);
    setProdDescription(product.description);
    setIsModalOpen(true);
  };

  // Handle Save (Add/Edit) Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodUnit || !prodImage || !prodDescription) {
      alert('Please fill in all fields.');
      return;
    }

    const payload = {
      name: prodName,
      category: prodCategory,
      price: parseFloat(prodPrice),
      unit: prodUnit,
      stock: parseInt(prodStock) || 0,
      image: prodImage,
      description: prodDescription
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${PRODUCT_URL}/${editingProduct._id || editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${PRODUCT_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts(vendorUser._id, token);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return;
    try {
      const res = await fetch(`${PRODUCT_URL}/${prodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts(vendorUser._id, token);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper stats
  const totalListings = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* AUTHENTICATION VIEW */}
      {!vendorUser ? (
        <div className="flex-center animate-fade-in" style={{ flexGrow: 1, padding: '24px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-color)' }}>
            
            {/* Logo */}
            <div className="flex-center" style={{ gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)', padding: '8px', borderRadius: '12px', color: 'white', display: 'flex' }}>
                <Store size={24} />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #ff6b00, #ffa500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-heading)' }}>
                GroceryHub Vendors
              </span>
            </div>

            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '8px' }}>
              {isRegister ? 'Register Vendor Account' : 'Vendor Portal Sign In'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '24px' }}>
              Manage your stock listings, fulfill catalog items, and view stats.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.8rem', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {isRegister && (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Store Owner Name"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 42px', fontSize: '0.9rem' }}
                    />
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 42px', fontSize: '0.9rem' }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Phone Number"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 42px', fontSize: '0.9rem' }}
                    />
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Store Location / Address"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 42px', fontSize: '0.9rem' }}
                    />
                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </>
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 42px', fontSize: '0.9rem' }}
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 42px', fontSize: '0.9rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                {isRegister ? 'Register Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {isRegister ? 'Already have a vendor account?' : "Don't have a vendor account yet?"}
              </span>
              <button 
                onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
                style={{ color: 'var(--primary)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                {isRegister ? 'Sign In' : 'Register Now'}
              </button>
            </div>

          </div>
        </div>
      ) : (
        
        // MAIN APP / VENDOR PORTAL
        <div className="animate-fade-in" style={{ flexGrow: 1 }}>
          
          {/* HEADER */}
          <header className="glass-panel" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0 0 16px 16px' }}>
            <div className="container" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex-center" style={{ gap: '8px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex' }}>
                  <Store size={18} />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>
                  Vendor Hub
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  🏪 {vendorUser.name}
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn-secondary" 
                  style={{ cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', border: '1px solid var(--border-color)' }}
                  title="Logout"
                >
                  <LogOut size={16} style={{ color: 'var(--danger)' }} />
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CONTAINER */}
          <main className="container">
            
            {/* PENDING APPROVAL VIEW */}
            {!vendorUser.isApproved ? (
              <div className="glass-panel animate-scale-up" style={{ padding: '40px 24px', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.02)', textAlign: 'center', marginTop: '20px' }}>
                <AlertCircle size={48} style={{ color: 'var(--accent)', marginBottom: '16px', margin: '0 auto' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Verification Pending</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                  Your vendor account has been created successfully. For security and quality assurance, GroceryHub Administrators must verify and approve your registration request before you can publish catalog items or update inventory.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => fetchProfile(token)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} /> Check Status
                  </button>
                </div>
              </div>
            ) : (
              
              // APPROVED VENDOR DASHBOARD
              <>
                {/* Stats cards row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px', marginTop: '10px' }}>
                  
                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      <span>Active Listings</span>
                      <Layers size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                      {totalListings} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Items</span>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      <span>Total Stock Units</span>
                      <Package size={16} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                      {totalStockUnits} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Units</span>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px', border: outOfStockCount > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border-color)' }}>
                    <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      <span>Out Of Stock Alarms</span>
                      <AlertCircle size={16} style={{ color: outOfStockCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: outOfStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {outOfStockCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Alerts</span>
                    </div>
                  </div>

                </div>

                {/* Main section bar */}
                <div className="flex-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>My Product Catalog</h2>
                  <button onClick={openAddModal} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Catalog Product
                  </button>
                </div>

                {/* Catalog Table */}
                {products.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '48px 24px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <ShoppingBag size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px', margin: '0 auto' }} />
                    <h3>No Products Listed</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      Your catalog is currently empty. Start publishing fresh organic items to attract shoppers.
                    </p>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.01)', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                            <th style={{ padding: '16px 20px' }}>Product</th>
                            <th style={{ padding: '16px 20px' }}>Category</th>
                            <th style={{ padding: '16px 20px' }}>Unit Price</th>
                            <th style={{ padding: '16px 20px' }}>Current Stock</th>
                            <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p) => {
                            const isOut = p.stock <= 0;
                            const isLow = p.stock <= 5;
                            return (
                              <tr key={p._id || p.id} className="table-row-hover" style={{ transition: 'background-color 0.2s', fontSize: '0.9rem' }}>
                                <td style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px' }}>
                                  <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                  <span style={{ fontWeight: '600' }}>{p.name}</span>
                                </td>
                                <td>
                                  <span className={`category-badge ${p.category}`}>{p.category}</span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                  ${p.price.toFixed(2)} / {p.unit}
                                </td>
                                <td>
                                  {isOut ? (
                                    <span style={{ color: 'var(--danger)', fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>OUT OF STOCK</span>
                                  ) : isLow ? (
                                    <span style={{ color: 'var(--danger)', fontWeight: '600', backgroundColor: 'rgba(239,68,68,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>LOW: {p.stock} left</span>
                                  ) : (
                                    <span style={{ color: 'var(--success)', fontWeight: '500' }}>{p.stock} units</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button 
                                      onClick={() => openEditModal(p)}
                                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', color: 'var(--primary)', backgroundColor: 'var(--bg-secondary)' }}
                                      title="Edit Item"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteProduct(p._id || p.id)}
                                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', color: 'var(--danger)', backgroundColor: 'var(--bg-secondary)' }}
                                      title="Delete Item"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

          </main>

        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '24px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        <div>© 2026 GroceryHub Vendor Fulfillment System. All Rights Reserved.</div>
      </footer>

      {/* ADD / EDIT DRAWER MODAL OVERLAY */}
      {isModalOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setIsModalOpen(false)}></div>
          <div className="flex-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, padding: '20px', pointerEvents: 'none' }}>
            <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '480px', borderRadius: '24px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              
              {/* Modal Header */}
              <div className="flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(var(--primary-rgb), 0.02)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  {editingProduct ? 'Edit Catalog Product' : 'Add Catalog Product'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ cursor: 'pointer', padding: '6px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form body */}
              <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. French Baguette"
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Category & Unit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        Category *
                      </label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="spices">Spices</option>
                        <option value="meat">Meat</option>
                        <option value="bakery">Bakery</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        Sales Unit *
                      </label>
                      <input
                        type="text"
                        required
                        value={prodUnit}
                        onChange={(e) => setProdUnit(e.target.value)}
                        placeholder="e.g. 1 Loaf, 2 Pack, 500g"
                        style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        Stock Count *
                      </label>
                      <input
                        type="number"
                        required
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Product Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Detailed Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Describe ingredients, texture, freshness..."
                      style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', resize: 'none' }}
                    />
                  </div>

                  {/* Modal Action buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      {editingProduct ? 'Save Changes' : 'Create Product'}
                    </button>
                  </div>

                </form>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default App;
