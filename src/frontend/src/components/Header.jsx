import React, { useState } from 'react';
import { ShoppingCart, User, Sun, Moon, LogOut, Search, Leaf, Home, ShoppingBag, History } from 'lucide-react';

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
  const [expanded, setExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleNavClick = (view) => {
    setActiveView(view);
    if (view === 'shop') {
      setSelectedCategory('all');
    }
  };

  return (
    <>
      {/* Immersive Vertical Sidebar */}
      <aside 
        className={`sidebar-nav ${expanded ? 'expanded' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo Section */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="sidebar-logo-wrapper"
        >
          <div className="logo-icon-bg">
            <Leaf size={22} />
          </div>
          <span className="logo-text">GroceryHub</span>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav-list">
          {/* Search Item */}
          <div className={`sidebar-nav-item search-item ${searchFocused ? 'focused' : ''}`}>
            <div className="sidebar-icon-container">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'shop') setActiveView('shop');
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="sidebar-search-input"
            />
          </div>

          {/* Home Link */}
          <button 
            onClick={() => handleNavClick('home')} 
            className={`sidebar-nav-item ${activeView === 'home' ? 'active' : ''}`}
          >
            <div className="sidebar-icon-container">
              <Home size={20} />
            </div>
            <span className="sidebar-nav-label">Home</span>
          </button>

          {/* Shop/Catalog Link */}
          <button 
            onClick={() => handleNavClick('shop')} 
            className={`sidebar-nav-item ${activeView === 'shop' ? 'active' : ''}`}
          >
            <div className="sidebar-icon-container">
              <ShoppingBag size={20} />
            </div>
            <span className="sidebar-nav-label">Shop Catalog</span>
          </button>

          {/* Orders History (Conditional) */}
          {currentUser && (
            <button 
              onClick={() => handleNavClick('orders')} 
              className={`sidebar-nav-item ${activeView === 'orders' ? 'active' : ''}`}
            >
              <div className="sidebar-icon-container">
                <History size={20} />
              </div>
              <span className="sidebar-nav-label">My Orders</span>
            </button>
          )}

          {/* Shopping Cart Trigger */}
          <button 
            onClick={toggleCart} 
            className="sidebar-nav-item cart-trigger-btn"
          >
            <div className="sidebar-icon-container" style={{ position: 'relative' }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="sidebar-cart-badge cart-badge-bump">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="sidebar-nav-label">My Cart</span>
          </button>
        </div>

        {/* Footer Actions Section */}
        <div className="sidebar-footer">
          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme} 
            className="sidebar-nav-item theme-toggle"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="sidebar-icon-container">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <span className="sidebar-nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Account Profile or Auth */}
          {currentUser ? (
            <div className="sidebar-user-section">
              <div className="sidebar-nav-item user-profile">
                <div className="sidebar-icon-container user-avatar">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <div className="user-details-text">
                  <span className="user-name-label">{(currentUser.name || currentUser.username || 'User').split(' ')[0]}</span>
                  <span className="user-role-badge">{currentUser.role || 'customer'}</span>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="sidebar-nav-item logout-btn"
                title="Logout"
              >
                <div className="sidebar-icon-container">
                  <LogOut size={20} style={{ color: 'var(--danger)' }} />
                </div>
                <span className="sidebar-nav-label" style={{ color: 'var(--danger)' }}>Logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={openAuthModal} 
              className="sidebar-nav-item login-btn"
            >
              <div className="sidebar-icon-container">
                <User size={20} />
              </div>
              <span className="sidebar-nav-label">Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Floating Bottom Nav for Mobile Screens */}
      <nav className="mobile-bottom-bar">
        <button 
          onClick={() => handleNavClick('home')} 
          className={`mobile-bottom-item ${activeView === 'home' ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button 
          onClick={() => handleNavClick('shop')} 
          className={`mobile-bottom-item ${activeView === 'shop' ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Shop</span>
        </button>
        <button 
          onClick={toggleCart} 
          className="mobile-bottom-item mobile-cart-btn"
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="mobile-cart-badge">
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>
        {currentUser && (
          <button 
            onClick={() => handleNavClick('orders')} 
            className={`mobile-bottom-item ${activeView === 'orders' ? 'active' : ''}`}
          >
            <History size={20} />
            <span>Orders</span>
          </button>
        )}
        {currentUser ? (
          <button onClick={logout} className="mobile-bottom-item">
            <LogOut size={20} style={{ color: 'var(--danger)' }} />
            <span>Logout</span>
          </button>
        ) : (
          <button onClick={openAuthModal} className="mobile-bottom-item">
            <User size={20} />
            <span>Sign In</span>
          </button>
        )}
      </nav>

      {/* Embedded CSS for sidebar details */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Sidebar Styling */
        .sidebar-nav {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 72px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 0;
          z-index: 1000;
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
          overflow: hidden;
        }

        .sidebar-nav.expanded, .sidebar-nav:hover {
          width: 240px;
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
        }

        /* Mobile layout overrides */
        @media (max-width: 768px) {
          .sidebar-nav {
            display: none !important;
          }
          .mobile-bottom-bar {
            display: flex !important;
          }
        }

        /* Brand Logo */
        .sidebar-logo-wrapper {
          display: flex;
          align-items: center;
          padding: 0 16px;
          height: 50px;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 24px;
        }

        .logo-icon-bg {
          background: linear-gradient(135deg, #00d2ff 0%, #005fec 100%);
          min-width: 40px;
          height: 40px;
          border-radius: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.4);
          transition: transform 0.3s;
        }

        .sidebar-logo-wrapper:hover .logo-icon-bg {
          transform: scale(1.05) rotate(5deg);
        }

        .logo-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.3rem;
          white-space: nowrap;
          background: linear-gradient(to right, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .sidebar-nav.expanded .logo-text, .sidebar-nav:hover .logo-text {
          opacity: 1;
        }

        /* Nav List */
        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
          padding: 0 12px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          height: 48px;
          width: 100%;
          border-radius: 12px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          text-align: left;
        }

        .sidebar-nav-item:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .sidebar-nav-item.active {
          color: var(--primary);
          background-color: rgba(0, 210, 255, 0.08);
          font-weight: 600;
        }

        .sidebar-icon-container {
          min-width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .sidebar-nav-item:hover .sidebar-icon-container {
          transform: scale(1.1);
        }

        .sidebar-nav-label {
          font-size: 0.95rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
          margin-left: 4px;
        }

        .sidebar-nav.expanded .sidebar-nav-label, .sidebar-nav:hover .sidebar-nav-label {
          opacity: 1;
        }

        /* Search Item Inside Sidebar */
        .search-item {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .search-item:hover {
          border-color: rgba(0, 210, 255, 0.4);
        }

        .search-item.focused {
          border-color: var(--primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .sidebar-search-input {
          width: 0;
          opacity: 0;
          height: 100%;
          font-size: 0.9rem;
          color: var(--text-primary);
          padding-right: 12px;
          transition: width 0.2s, opacity 0.2s;
        }

        .sidebar-nav.expanded .sidebar-search-input, .sidebar-nav:hover .sidebar-search-input {
          width: 150px;
          opacity: 1;
        }

        /* Cart Badge */
        .sidebar-cart-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background-color: var(--danger);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* User Profile Badge */
        .sidebar-user-section {
          border-top: 1px solid var(--border-color);
          margin-top: 12px;
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-avatar {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 1rem;
          border-radius: 12px;
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          margin: 8px;
          box-shadow: 0 0 10px rgba(var(--primary-rgb), 0.3);
        }

        .user-details-text {
          display: flex;
          flex-direction: column;
          margin-left: 8px;
          opacity: 0;
          transition: opacity 0.2s;
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-nav.expanded .user-details-text, .sidebar-nav:hover .user-details-text {
          opacity: 1;
        }

        .user-name-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role-badge {
          font-size: 0.65rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sidebar-footer {
          padding: 0 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Mobile Floating Bottom Bar styling */
        .mobile-bottom-bar {
          position: fixed;
          bottom: 12px;
          left: 12px;
          right: 12px;
          height: 64px;
          border-radius: 20px;
          background: rgba(12, 17, 27, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          display: none; /* hidden on desktop */
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          padding: 0 8px;
        }

        .mobile-bottom-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: var(--text-secondary);
          flex: 1;
          height: 100%;
          cursor: pointer;
        }

        .mobile-bottom-item span {
          font-size: 0.65rem;
          font-weight: 500;
        }

        .mobile-bottom-item.active {
          color: var(--primary);
        }

        .mobile-cart-badge {
          position: absolute;
          top: -6px;
          right: -10px;
          background-color: var(--danger);
          color: white;
          font-size: 0.6rem;
          font-weight: bold;
          border-radius: 50%;
          min-width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}} />
    </>
  );
}
