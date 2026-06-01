import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout, 
  onStartShopping 
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% sales tax
  const shipping = subtotal > 30 || subtotal === 0 ? 0 : 4.99; // Free shipping over $30
  const total = subtotal + tax + shipping;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="glass-panel" style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '100%',
        maxWidth: '440px',
        zIndex: 1000,
        boxShadow: 'var(--glass-shadow)',
        borderLeft: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Header */}
        <div className="flex-between" style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(var(--primary-rgb), 0.02)'
        }}>
          <div className="flex-center" style={{ gap: '8px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Your Shopping Cart</h2>
            <span style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              padding: '2px 8px',
              borderRadius: '99px',
              fontWeight: '600'
            }}>
              {cartItems.length}
            </span>
          </div>
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

        {/* Scrollable Items list */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {cartItems.length === 0 ? (
            <div className="flex-center" style={{
              flexDirection: 'column',
              gap: '16px',
              height: '100%',
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(var(--primary-rgb), 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <ShoppingBag size={36} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Cart is Empty</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px', lineHeight: '1.5' }}>
                Looks like you haven't added any fresh groceries to your cart yet.
              </p>
              <button 
                onClick={() => {
                  onStartShopping();
                  onClose();
                }}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.productId}
                style={{
                  display: 'flex',
                  gap: '14px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                {/* Image */}
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div className="flex-between">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </h4>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ${item.price.toFixed(2)} / {item.unit}
                    </span>
                  </div>

                  {/* Quantity and delete row */}
                  <div className="flex-between" style={{ marginTop: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-secondary)'
                    }}>
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        style={{ padding: '6px 10px', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ padding: '0 8px', fontWeight: '600', fontSize: '0.9rem' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        style={{ padding: '6px 10px', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(item.productId)}
                      style={{
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={16} onMouseOver={(e)=>e.currentTarget.style.color='var(--danger)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary - only shows if cart is not empty */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'rgba(var(--primary-rgb), 0.01)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div className="flex-between" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Sales Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            {shipping > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '-6px' }}>
                Add ${(30 - subtotal).toFixed(2)} more for FREE shipping!
              </span>
            )}
            
            <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />

            <div className="flex-between" style={{ fontSize: '1.15rem', fontWeight: '700' }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</span>
            </div>

            <button 
              onClick={onCheckout}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                marginTop: '12px',
                fontSize: '1rem'
              }}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  );
}
