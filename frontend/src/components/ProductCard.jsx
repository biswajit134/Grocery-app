import React from 'react';
import { Star, ShoppingCart, Info } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onViewDetails }) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="glass-panel card-glow-hover animate-fade-in" style={{
      borderRadius: '16px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* Category Badge */}
      <span className={`category-badge ${product.category}`} style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 2,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {product.category}
      </span>

      {/* Product Image */}
      <div 
        onClick={() => onViewDetails(product)}
        style={{
          width: '100%',
          height: '180px',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <img 
          src={product.image} 
          alt={product.name} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          className="product-img-hover"
        />
        {isOutOfStock && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1rem',
            letterSpacing: '0.05em'
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'space-between'
      }}>
        <div>
          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {product.rating ? product.rating.toFixed(1) : '4.5'}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onViewDetails(product)}
            style={{
              fontSize: '1.05rem',
              fontWeight: '600',
              marginBottom: '4px',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {product.name}
          </h3>

          {product.vendorName && (
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              🏪 Sold by: {product.vendorName}
            </div>
          )}

          {/* Description */}
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4'
          }}>
            {product.description}
          </p>

          {/* Stock status indicator */}
          <div style={{ marginBottom: '12px', fontSize: '0.75rem', fontWeight: '500' }}>
            {isOutOfStock ? (
              <span style={{ color: 'var(--danger)' }}>Unavailable</span>
            ) : isLowStock ? (
              <span style={{ 
                color: 'var(--danger)', 
                backgroundColor: 'rgba(244, 63, 94, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '4px' 
              }}>
                Only {product.stock} items left!
              </span>
            ) : (
              <span style={{ color: 'var(--primary)' }}>In Stock ({product.stock})</span>
            )}
          </div>
        </div>

        {/* Footer info (price + button) */}
        <div className="flex-between" style={{ marginTop: 'auto' }}>
          <div>
            {product.discountPrice !== null && product.discountPrice !== undefined ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--primary)' }}>
                    ${product.discountPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    ${product.price.toFixed(2)}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  / {product.unit}
                </span>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--primary)' }}>
                  ${product.price.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                  / {product.unit}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onViewDetails(product)}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
              title="View Details"
            >
              <Info size={16} />
            </button>
            <button 
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className="btn btn-primary"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                opacity: isOutOfStock ? 0.5 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer'
              }}
            >
              <ShoppingCart size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .card-glow-hover:hover .product-img-hover {
          transform: scale(1.08);
        }
      `}} />
    </div>
  );
}
