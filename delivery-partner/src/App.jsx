import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  Lock, 
  Mail, 
  LogOut, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Navigation,
  DollarSign
} from 'lucide-react';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5001/api/auth';
const ORDER_URL = import.meta.env.VITE_ORDER_URL || 'http://localhost:5003/api/orders';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('driverToken') || '');
  const [driverUser, setDriverUser] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  
  // Auth Form States
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch driver profile
  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role !== 'driver') {
          setErrorMsg('Access denied. This portal is for delivery drivers only.');
          handleLogout();
          return;
        }
        setDriverUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch driver's active deliveries
  const fetchDeliveries = async (authToken) => {
    try {
      const res = await fetch(`${ORDER_URL}/driver/my-deliveries`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync token and load info
  useEffect(() => {
    if (token) {
      localStorage.setItem('driverToken', token);
      fetchProfile(token);
      fetchDeliveries(token);
    } else {
      localStorage.removeItem('driverToken');
      setDriverUser(null);
      setDeliveries([]);
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
        body: JSON.stringify({ username, password, name, email, phone, address, role: 'driver' })
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
    setDriverUser(null);
    setDeliveries([]);
    setErrorMsg('');
  };

  // Update status (Pick Up package or Mark Delivered)
  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      const res = await fetch(`${ORDER_URL}/${orderId}/driver-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryStatus: nextStatus })
      });
      if (res.ok) {
        fetchDeliveries(token);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Stats helper variables
  const activeDeliveries = deliveries.filter(d => d.deliveryStatus !== 'Delivered');
  const completedDeliveries = deliveries.filter(d => d.deliveryStatus === 'Delivered');
  const totalEarnings = completedDeliveries.length * 5.00; // Mock $5 per delivery

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* AUTHENTICATION VIEW */}
      {!driverUser ? (
        <div className="flex-center animate-fade-in" style={{ flexGrow: 1, padding: '24px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-color)' }}>
            
            {/* Logo */}
            <div className="flex-center" style={{ gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)', padding: '8px', borderRadius: '12px', color: 'white', display: 'flex' }}>
                <Truck size={24} />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #ff6b00, #ffa500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                GroceryHub Drivers
              </span>
            </div>

            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '8px' }}>
              {isRegister ? 'Create Driver Account' : 'Delivery Partner Sign In'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '24px' }}>
              Access your route schedules and track order assignments.
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
                      placeholder="Full Name"
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
                      placeholder="Base Address / Region"
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
                {isRegister ? 'Already have a driver account?' : "Don't have a driver account yet?"}
              </span>
              <button 
                onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
                style={{ color: 'var(--primary)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}
              >
                {isRegister ? 'Sign In' : 'Register Now'}
              </button>
            </div>

          </div>
        </div>
      ) : (
        
        // MAIN APP / DRIVER PORTAL
        <div className="animate-fade-in" style={{ flexGrow: 1 }}>
          
          {/* HEADER */}
          <header className="glass-panel" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0 0 16px 16px' }}>
            <div className="container" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex-center" style={{ gap: '8px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex' }}>
                  <Truck size={18} />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>
                  Driver Hub
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Hi, {driverUser.name.split(' ')[0]}
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

          {/* DRIVER STATS PANELS */}
          <main className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                  <span>Active Workload</span>
                  <Clock size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                  {activeDeliveries.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Assigned</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                  <span>Completed Deliveries</span>
                  <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                  {completedDeliveries.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Delivered</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                  <span>Driver Earnings</span>
                  <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ${totalEarnings.toFixed(2)}
                </div>
              </div>

            </div>

            {/* ASSIGNED DELIVERIES QUEUE */}
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>My Delivery Orders Queue</h2>
            
            {deliveries.length === 0 ? (
              <div className="glass-panel" style={{ padding: '48px 24px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Truck size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px', margin: '0 auto' }} />
                <h3>No Orders Assigned</h3>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  You do not have any delivery orders assigned. Check back once the admin dispatches packages.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {deliveries.map((order) => {
                  const orderId = order._id?.toString() || order.id?.toString() || '';
                  const shortId = orderId ? orderId.slice(-8) : 'N/A';
                  const isDelivered = order.deliveryStatus === 'Delivered';
                  return (
                    <div key={orderId} className="glass-panel animate-scale-up" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      
                      {/* Top Info Bar */}
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>DELIVERY ORDER #{shortId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Assigned on {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>

                        <div>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            backgroundColor: isDelivered ? 'rgba(16,185,129,0.15)' : 'rgba(255,107,0,0.15)',
                            color: isDelivered ? '#10b981' : 'var(--primary)'
                          }}>
                            {order.deliveryStatus}
                          </span>
                        </div>
                      </div>

                      {/* Recipient Details & Items list */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Delivery Destination</h4>
                          <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                            <div style={{ fontWeight: '600' }}>{order.shippingDetails?.name || 'N/A'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <MapPin size={14} /> {order.shippingDetails?.address || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <Phone size={14} /> {order.shippingDetails?.phone || 'N/A'}
                            </div>
                            <div style={{ color: 'var(--accent)', fontWeight: '500', marginTop: '6px' }}>
                              🕒 Time Slot: {order.shippingDetails?.deliverySlot || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Delivery Package Items</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>• {item.name} <span style={{ color: 'var(--text-muted)' }}>({item.quantity} x {item.unit})</span></span>
                              </div>
                            ))}
                          </div>
                          
                          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invoice Total:</span>
                            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>${(order.totalAmount || 0).toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'right', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            ({order.paymentMethod || 'N/A'} • {order.paymentStatus || 'N/A'})
                          </div>
                        </div>
                      </div>

                      {/* Map/Transit Tracker simulation widget */}
                      {!isDelivered && (
                        <div style={{ margin: '20px 0' }}>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Transit Progress Map</h4>
                          <div className="road-container">
                            <div className="road-line"></div>
                            <div className="road-dot start"></div>
                            
                            {/* Pulse indicator behind the motorcycle */}
                            <div 
                              className="pulse-indicator"
                              style={{ 
                                left: order.deliveryStatus === 'Accepted' ? '35%' : '70%'
                              }}
                            ></div>

                            {/* Active Driver motorcycle icon */}
                            <div 
                              className="motorcycle-icon"
                              style={{ 
                                left: order.deliveryStatus === 'Accepted' ? '35%' : '70%'
                              }}
                            >
                              <Navigation size={18} style={{ transform: 'rotate(90deg)' }} />
                            </div>

                            <div className="road-dot end"></div>
                          </div>
                          <div className="flex-between" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            <span>Store Warehouse</span>
                            <span>In Transit</span>
                            <span>Customer Home</span>
                          </div>
                        </div>
                      )}

                      {/* Interactive Logistics Driver Buttons */}
                      {!isDelivered && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          {order.deliveryStatus === 'Accepted' ? (
                            <button 
                              onClick={() => handleUpdateStatus(orderId, 'Picked Up')}
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '10px' }}
                            >
                              Pick Up Package (Start Transit)
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateStatus(orderId, 'Delivered')}
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '10px', backgroundColor: 'var(--success)' }}
                            >
                              Handover Package (Mark Delivered)
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '24px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        <div>© 2026 GroceryHub Delivery Partner Dispatch Network. All Rights Reserved.</div>
      </footer>

    </div>
  );
}

export default App;
