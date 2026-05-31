import React, { useState } from 'react';
import { ShoppingCart, User, Sun, Moon, Menu, X, LogOut, Settings, Search, Leaf } from 'lucide-react';

export default function Header({ 
  theme, 
  toggleTheme, 
  currentUser, 
  logout, 
  openAuthModal, 
  cartCount, 
  toggleCart, 
  activeView, 
  setActiveView, 
  selectedCategory, 
  setSelectedCategory,
  searchQuery,
  setSearchQuery
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'vegetables', label: 'Vegetables' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'spices', label: 'Spices' },
    { id: 'meat', label: 'Meat' },
    { id: 'bakery', label: 'Bakery' }
  ];

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setActiveView('shop');
    setMobileMenuOpen(false);
  };

  return (
    <header className="glass-panel sticky-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: '0 0 16px 16px'
    }}>
      <div className="container" style={{ padding: '16px 24px' }}>
        <div className="flex-between">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveView('home')} 
            className="flex-center" 
            style={{ gap: '8px', cursor: 'pointer' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)',
              padding: '8px',
              borderRadius: '10px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Leaf size={22} />
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.4rem',
              background: 'linear-gradient(to right, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              GroceryHub
            </span>
          </div>

          {/* Search bar */}
          <div className="search-container" style={{
            position: 'relative',
            maxWidth: '380px',
            width: '100%',
            margin: '0 20px',
            display: 'none', // Shown on desktop
          }}>
            <input
              type="text"
              placeholder="Search vegetables, fruits, spices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'shop') setActiveView('shop');
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '10px 16px 10px 42px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                transition: 'border-color 0.25s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav flex-center" style={{ gap: '20px' }}>
            <button 
              onClick={() => setActiveView('home')} 
              style={{
                fontWeight: activeView === 'home' ? '600' : '400',
                color: activeView === 'home' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveView('shop')} 
              style={{
                fontWeight: activeView === 'shop' ? '600' : '400',
                color: activeView === 'shop' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Shop
            </button>
            {currentUser && (
              <button 
                onClick={() => setActiveView('orders')} 
                style={{
                  fontWeight: activeView === 'orders' ? '600' : '400',
                  color: activeView === 'orders' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                My Orders
              </button>
            )}
          </nav>

          {/* Actions (Theme, Cart, Profile) */}
          <div className="flex-center" style={{ gap: '12px' }}>
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              style={{
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {theme === 'dark' ? <Sun className="theme-btn-svg" size={18} /> : <Moon className="theme-btn-svg" size={18} />}
            </button>

            {/* Shopping Cart Trigger */}
            <button 
              onClick={toggleCart} 
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                backgroundColor: 'rgba(var(--primary-rgb), 0.05)'
              }}
            >
              <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
              {cartCount > 0 && (
                <span className="cart-badge-bump" style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Account Profile */}
            {currentUser ? (
              <div className="flex-center" style={{ gap: '8px' }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'none' // Shown on wider screens
                }}>
                  Hi, {(currentUser.name || currentUser.username || 'User').split(' ')[0]}
                </span>
                <button 
                  onClick={logout} 
                  style={{
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--danger)'
                  }}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={openAuthModal} 
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <User size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500', display: 'none' }}>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger menu */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              style={{
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'none' // Shown on mobile
              }}
              className="hamburger-btn"
            >
              <Menu size={18} />
            </button>
          </div>

        </div>

        {/* Categories Bar (Sub-header) */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          overflowX: 'auto',
          display: 'flex',
          gap: '12px',
          scrollbarWidth: 'none'
        }} className="categories-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                backgroundColor: selectedCategory === cat.id && activeView === 'shop' 
                  ? 'var(--primary)' 
                  : 'var(--bg-secondary)',
                color: selectedCategory === cat.id && activeView === 'shop'
                  ? '#ffffff'
                  : 'var(--text-secondary)',
                border: selectedCategory === cat.id && activeView === 'shop'
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border-color)'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* CSS overrides for responsiveness */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 640px) {
          .search-container { display: block !important; }
          .flex-center span { display: inline !important; }
          .flex-center button span { display: inline !important; }
        }
        @media (max-width: 820px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        .categories-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="glass-panel animate-scale-up" style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            right: '20px',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 1000,
            animationDuration: '0.2s'
          }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {/* Search Input for Mobile */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeView !== 'shop') setActiveView('shop');
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '10px 16px 10px 42px',
                  borderRadius: '12px',
                  fontSize: '0.9rem'
                }}
              />
              <Search size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
                style={{ textAlign: 'left', fontSize: '1.1rem', color: activeView === 'home' ? 'var(--primary)' : 'var(--text-primary)' }}
              >
                Home
              </button>
              <button 
                onClick={() => { setActiveView('shop'); setMobileMenuOpen(false); }}
                style={{ textAlign: 'left', fontSize: '1.1rem', color: activeView === 'shop' ? 'var(--primary)' : 'var(--text-primary)' }}
              >
                Shop Listing
              </button>
              {currentUser && (
                <button 
                  onClick={() => { setActiveView('orders'); setMobileMenuOpen(false); }}
                  style={{ textAlign: 'left', fontSize: '1.1rem', color: activeView === 'orders' ? 'var(--primary)' : 'var(--text-primary)' }}
                >
                  My Order History
                </button>
              )}

              <hr style={{ borderColor: 'var(--border-color)', margin: '8px 0' }} />

              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Categories</span>
              {categories.slice(1).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    textAlign: 'left',
                    fontSize: '1rem',
                    color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-secondary)',
                    textTransform: 'capitalize'
                  }}
                >
                  {cat.id}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
