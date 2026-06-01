import React, { useState } from 'react';
import { X, Lock, User, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  if (!isOpen) return null;

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('user');

  const handleTabChange = (isLogin) => {
    setIsLoginTab(isLogin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginTab) {
        if (!username || !password) {
          setError('Please fill in all fields.');
          setLoading(false);
          return;
        }
        await onLogin(username, password);
        onClose();
      } else {
        if (!username || !password || !name || !email) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        await onRegister({ username, password, name, email, phone, address, role });
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="flex-center" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        padding: '20px',
        pointerEvents: 'none'
      }}>
        <div className="glass-panel animate-scale-up" style={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '24px',
          overflow: 'hidden',
          pointerEvents: 'auto',
          boxShadow: 'var(--glass-shadow)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '95vh'
        }}>
          {/* Header */}
          <div className="flex-between" style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(var(--primary-rgb), 0.02)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {isLoginTab ? 'Welcome to GroceryHub' : 'Create an Account'}
            </h2>
            <button 
              onClick={onClose} 
              style={{
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
            
            {/* Tab Swapper */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <button 
                onClick={() => handleTabChange(true)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  backgroundColor: isLoginTab ? 'var(--bg-surface)' : 'transparent',
                  color: isLoginTab ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
              <button 
                onClick={() => handleTabChange(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  backgroundColor: !isLoginTab ? 'var(--bg-surface)' : 'transparent',
                  color: !isLoginTab ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                Register
              </button>
            </div>



            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.85rem',
                color: 'var(--danger)',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Common Fields */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Username *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px 10px 38px',
                      fontSize: '0.9rem'
                    }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Registration Only Fields */}
              {!isLoginTab && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Full Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px 10px 38px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Email Address *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px 10px 38px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Phone Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 555-0199"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px 10px 38px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Delivery Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 123 Main St, New York, NY"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px 10px 38px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Account Type *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="user">Customer</option>
                      <option value="driver">Delivery Driver</option>
                    </select>
                  </div>
                </>
              )}

              {/* Password Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 42px 10px 38px',
                      fontSize: '0.9rem'
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  marginTop: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : isLoginTab ? 'Sign In' : 'Register Account'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </>
  );
}
