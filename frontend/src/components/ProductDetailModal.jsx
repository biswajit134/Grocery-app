import React, { useState } from 'react';
import { X, Star, ShoppingCart, Plus, Minus, ShieldAlert } from 'lucide-react';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
    onClose();
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
          maxWidth: '650px',
          borderRadius: '24px',
          overflow: 'hidden',
          pointerEvents: 'auto',
          boxShadow: 'var(--glass-shadow)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}>
          {/* Header */}
          <div className="flex-between" style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(var(--primary-rgb), 0.02)'
          }}>
            <span className={`category-badge ${product.category}`}>
              {product.category}
            </span>
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

          {/* Body Content - Scrollable */}
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px'
          }} className="modal-grid-body">
            
            {/* Left Col: Image */}
            <div style={{
              width: '100%',
              height: '240px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
              position: 'relative'
            }}>
              <img 
                src={product.image} 
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {isOutOfStock && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  OUT OF STOCK
                </div>
              )}
            </div>

            {/* Right Col: Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
                  {product.name}
                </h2>
                
                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < Math.round(product.rating || 4.5) ? '#f59e0b' : 'none'} 
                        color="#f59e0b" 
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ({product.rating || '4.5'} out of 5 stars)
                  </span>
                </div>

                {/* Price tag */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                    / {product.unit}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  {product.description}
                </p>
              </div>

              {/* Nutrition Card */}
              <div className="glass-panel" style={{
                borderRadius: '16px',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--border-color)'
              }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Nutritional Value (Per {product.unit})
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ textAlign: 'center', flex: 1, padding: '8px', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent)' }}>{product.nutrition?.calories || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calories</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1, padding: '8px', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary)' }}>{product.nutrition?.protein || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protein</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1, padding: '8px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{product.nutrition?.carbs || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carbs</div>
                  </div>
                </div>
              </div>

              {/* Stock Warning details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                {isOutOfStock ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
                    <ShieldAlert size={16} /> Item is currently sold out and undergoing restocking.
                  </div>
                ) : isLowStock ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    color: 'var(--danger)',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    width: '100%'
                  }}>
                    <ShieldAlert size={16} /> Hurry! Only {product.stock} items left in stock.
                  </div>
                ) : (
                  <span style={{ color: 'var(--primary)', fontWeight: '500' }}>
                    ✓ In stock and ready to ship ({product.stock} available)
                  </span>
                )}
              </div>

              {/* Add to Cart Section */}
              {!isOutOfStock && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  {/* Quantity selector */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    <button 
                      onClick={handleDecrement}
                      style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} style={{ opacity: quantity <= 1 ? 0.3 : 1 }} />
                    </button>
                    <span style={{ padding: '0 16px', fontWeight: '700', fontSize: '1.1rem', minWidth: '40px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button 
                      onClick={handleIncrement}
                      style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      disabled={quantity >= product.stock}
                    >
                      <Plus size={16} style={{ opacity: quantity >= product.stock ? 0.3 : 1 }} />
                    </button>
                  </div>

                  {/* Add button */}
                  <button 
                    onClick={handleAddToCartClick}
                    className="btn btn-primary"
                    style={{ flexGrow: 1, padding: '14px', borderRadius: '12px' }}
                  >
                    <ShoppingCart size={18} /> Add {quantity} to Cart — ${(product.price * quantity).toFixed(2)}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 580px) {
          .modal-grid-body {
            grid-template-columns: 1fr 1.2fr !important;
          }
          .modal-grid-body div:first-child {
            height: 100% !important;
            max-height: 350px;
          }
        }
      `}} />
    </>
  );
}
