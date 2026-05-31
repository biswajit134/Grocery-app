import React, { useState } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Truck, 
  RefreshCw, 
  X, 
  ChevronRight 
} from 'lucide-react';

export default function AdminDashboard({ 
  products, 
  orders, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onUpdateOrderStatus 
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for Add/Edit
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('vegetables');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('1kg');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');

  // Calculate statistics
  const totalSales = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  
  const lowStockItems = products.filter(p => p.stock <= 5);
  const pendingOrders = orders.filter(o => o.status !== 'Delivered').length;

  const openAddModal = () => {
    setProdName('');
    setProdCategory('vegetables');
    setProdPrice('');
    setProdUnit('1kg');
    setProdStock('');
    setProdImage('');
    setProdDescription('');
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdPrice(product.price);
    setProdUnit(product.unit);
    setProdStock(product.stock);
    setProdImage(product.image);
    setProdDescription(product.description);
    setIsAddModalOpen(true);
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodUnit || !prodImage || !prodDescription) {
      alert('Please fill in all required fields.');
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

    if (editingProduct) {
      onUpdateProduct(editingProduct._id || editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (prodId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDeleteProduct(prodId);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'rgba(245, 158, 11, 0.15)'; // Amber
      case 'Packing': return 'rgba(59, 130, 246, 0.15)'; // Blue
      case 'Out for Delivery': return 'rgba(249, 115, 22, 0.15)'; // Orange
      case 'Delivered': return 'rgba(16, 185, 129, 0.15)'; // Green
      default: return 'var(--bg-secondary)';
    }
  };

  const getOrderStatusTextColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'Packing': return '#3b82f6';
      case 'Out for Delivery': return '#f97316';
      case 'Delivered': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'Pending') return 'Packing';
    if (currentStatus === 'Packing') return 'Out for Delivery';
    if (currentStatus === 'Out for Delivery') return 'Delivered';
    return null;
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
      
      {/* Welcome & Overview stats */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Overview of sales activity, product inventory, and logistics processing.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Sales Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div className="flex-between" style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue</span>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>
            ${totalSales.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            From {totalOrders} orders completed/placed
          </div>
        </div>

        {/* Orders Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div className="flex-between" style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Orders</span>
            <ShoppingBag size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>
            {pendingOrders} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>pending</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalOrders - pendingOrders} orders fully delivered
          </div>
        </div>

        {/* Products Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div className="flex-between" style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Products Stock</span>
            <CheckCircle size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>
            {totalProducts}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Distributed in 4 key categories
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="glass-panel" style={{
          padding: '20px',
          borderRadius: '16px',
          border: lowStockItems.length > 0 ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid var(--border-color)',
          backgroundColor: lowStockItems.length > 0 ? 'rgba(244, 63, 94, 0.02)' : 'var(--glass-bg)'
        }}>
          <div className="flex-between" style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Low Stock Alarms</span>
            <AlertTriangle size={20} style={{ color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {lowStockItems.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Products with 5 units or less left
          </div>
        </div>
      </div>

      {/* Tab Switcher & Action button */}
      <div className="flex-between" style={{
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: activeTab === 'products' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'products' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Manage Catalog ({totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: activeTab === 'orders' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'orders' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Manage Orders ({totalOrders})
          </button>
        </div>

        {activeTab === 'products' && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* TAB A: Manage Catalog / Products list */}
      {activeTab === 'products' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '16px 20px' }}>Product</th>
                  <th style={{ padding: '16px 20px' }}>Category</th>
                  <th style={{ padding: '16px 20px' }}>Unit Price</th>
                  <th style={{ padding: '16px 20px' }}>Stock Level</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No products found in database. Seed or create one!
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stock <= 5;
                    const isOut = p.stock <= 0;
                    return (
                      <tr key={p._id || p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                        {/* Name & image */}
                        <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          <span style={{ fontWeight: '600' }}>{p.name}</span>
                        </td>
                        
                        {/* Category */}
                        <td style={{ padding: '14px 20px' }}>
                          <span className={`category-badge ${p.category}`} style={{ fontSize: '0.7rem' }}>{p.category}</span>
                        </td>

                        {/* Price */}
                        <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                          ${p.price.toFixed(2)} / {p.unit}
                        </td>

                        {/* Stock status (Low alarms) */}
                        <td style={{ padding: '14px 20px' }}>
                          {isOut ? (
                            <span style={{ color: 'var(--danger)', fontWeight: '700', backgroundColor: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>OUT OF STOCK</span>
                          ) : isLow ? (
                            <span style={{ color: 'var(--danger)', fontWeight: '600', backgroundColor: 'rgba(244,63,94,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              LOW: {p.stock} left
                            </span>
                          ) : (
                            <span style={{ color: 'var(--primary)' }}>OK: {p.stock} units</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditModal(p)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', color: 'var(--primary)' }}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p._id || p.id)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', color: 'var(--danger)' }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB B: Manage Orders / Logistics queues */}
      {activeTab === 'orders' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '16px 20px' }}>Order Details</th>
                  <th style={{ padding: '16px 20px' }}>Recipient & Delivery Details</th>
                  <th style={{ padding: '16px 20px' }}>Order Items Summary</th>
                  <th style={{ padding: '16px 20px' }}>Financial Info</th>
                  <th style={{ padding: '16px 20px' }}>Logistics Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No orders have been submitted yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    if (!order) return null;
                    const orderId = order._id?.toString() || order.id?.toString() || '';
                    const shortId = orderId ? orderId.slice(-8) : 'N/A';
                    const nextStat = getNextStatus(order.status);
                    return (
                      <tr key={orderId} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                        {/* ID & Date */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>#{shortId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                          </div>
                        </td>

                        {/* Recipient & address */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: '600' }}>{order.shippingDetails?.name || 'N/A'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.shippingDetails?.phone || 'N/A'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.shippingDetails?.address || ''}>
                            {order.shippingDetails?.address || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '500', marginTop: '2px' }}>
                            🕒 {order.shippingDetails?.deliverySlot || 'N/A'}
                          </div>
                        </td>

                        {/* Items */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.75rem' }}>
                                • {item.name} <span style={{ color: 'var(--text-muted)' }}>({item.quantity} x {item.unit})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Total & Payment Mode */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.95rem' }}>
                            ${(order.totalAmount || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {order.paymentMethod || 'N/A'} • <span style={{ color: order.paymentStatus === 'Paid' ? 'var(--primary)' : 'var(--accent)' }}>{order.paymentStatus || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: getOrderStatusColor(order.status),
                            color: getOrderStatusTextColor(order.status),
                            display: 'inline-block'
                          }}>
                            {order.status || 'N/A'}
                          </span>
                        </td>

                        {/* Logistics Updates */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {nextStat ? (
                            <button
                              onClick={() => onUpdateOrderStatus(orderId, nextStat)}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Truck size={12} /> Ship to {nextStat} <ChevronRight size={12} />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.75rem' }}>
                              ✓ Completed
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL FORM OVERLAY */}
      {isAddModalOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setIsAddModalOpen(false)}></div>
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
              maxWidth: '480px',
              borderRadius: '24px',
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  {editingProduct ? 'Edit Catalog Product' : 'Add Catalog Product'}
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
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

              {/* Form body */}
              <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
                <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
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
                      placeholder="e.g. Organic Strawberries"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '0.85rem'
                      }}
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
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="spices">Spices</option>
                        <option value="meat">Meat</option>
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
                        placeholder="e.g. 500g, 1 Bunch, 1kg"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '0.85rem'
                        }}
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
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '0.85rem'
                        }}
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
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '0.85rem'
                        }}
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
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '0.85rem'
                      }}
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
                      placeholder="Describe the freshness, nutritional values, origin..."
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {/* Submit buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
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

      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
        .light-mode .table-row-hover:hover {
          background-color: rgba(0, 0, 0, 0.01);
        }
      `}} />
    </div>
  );
}
