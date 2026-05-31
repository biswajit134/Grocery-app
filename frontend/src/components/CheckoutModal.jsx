import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Calendar, CheckCircle, Download, ArrowLeft, ArrowRight } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, cartItems, currentUser, onSubmitOrder }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1); // 1: Delivery, 2: Payment, 3: Success
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'cod'
  const [createdOrder, setCreatedOrder] = useState(null);

  // Form Fields - Delivery
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('09:00 AM - 12:00 PM');

  // Form Fields - Card Payment
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);

  // Calculate order totals
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 30 ? 0 : 4.99;
  const totalAmount = subtotal + tax + shipping;

  // Pre-fill delivery details if user logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser, isOpen]);

  // Card formatting
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    // Format with spaces
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!name || !phone || !address || !deliverySlot) {
        alert('Please fill in all delivery details.');
        return;
      }
      setStep(2);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        alert('Please fill in all credit card details.');
        return;
      }
    }

    try {
      const orderData = {
        shippingDetails: {
          name,
          phone,
          address,
          deliverySlot
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          image: item.image
        })),
        paymentMethod,
        totalAmount
      };

      const result = await onSubmitOrder(orderData);
      setCreatedOrder(result);
      setStep(3);
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Failed to place order.');
    }
  };

  // Simulates downloading a confirmation receipt text file
  const handleDownloadReceipt = () => {
    if (!createdOrder) return;

    const receiptText = `
========================================
             GROCERYHUB RECEIPT         
========================================
Order ID: ${createdOrder._id || createdOrder.id || 'N/A'}
Date: ${new Date(createdOrder.createdAt).toLocaleString()}
Customer: ${createdOrder.customerName}
Email: ${createdOrder.customerEmail}

SHIPPING DETAILS:
Name: ${createdOrder.shippingDetails.name}
Phone: ${createdOrder.shippingDetails.phone}
Address: ${createdOrder.shippingDetails.address}
Delivery Slot: ${createdOrder.shippingDetails.deliverySlot}

ITEMS ORDERED:
${createdOrder.items.map(item => `- ${item.name} (${item.quantity} x ${item.unit}) : $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

SUMMARY:
Subtotal: $${subtotal.toFixed(2)}
Tax (8%): $${tax.toFixed(2)}
Shipping: ${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
----------------------------------------
Total Amount Paid: $${createdOrder.totalAmount.toFixed(2)}
Payment Method: ${createdOrder.paymentMethod.toUpperCase()}
Payment Status: ${createdOrder.paymentStatus}
Order Status: ${createdOrder.status}

Thank you for shopping at GroceryHub!
========================================
    `;

    const element = document.createElement("a");
    const file = new Blob([receiptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `GroceryHub_Receipt_${createdOrder._id || 'order'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={step < 3 ? onClose : undefined}></div>
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
          maxWidth: '520px',
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
              {step === 1 && '1. Shipping & Delivery'}
              {step === 2 && '2. Payment Selection'}
              {step === 3 && 'Order Completed!'}
            </h2>
            {step < 3 && (
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
            )}
          </div>

          {/* Stepper Progress Bar */}
          {step < 3 && (
            <div style={{ display: 'flex', height: '4px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{
                flex: 1,
                backgroundColor: 'var(--primary)',
                transition: 'all 0.3s'
              }}></div>
              <div style={{
                flex: 1,
                backgroundColor: step >= 2 ? 'var(--primary)' : 'var(--border-color)',
                transition: 'all 0.3s'
              }}></div>
            </div>
          )}

          {/* Modal Content */}
          <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
            
            {/* STEP 1: Delivery Details */}
            {step === 1 && (
              <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Recipient Full Name *
                  </label>
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
                      padding: '10px 14px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Complete Shipping Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, City, State, ZIP code"
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      resize: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Preferred Delivery Time Slot *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px 10px 38px',
                        fontSize: '0.9rem',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                      <option value="12:00 PM - 03:00 PM">Midday (12:00 PM - 03:00 PM)</option>
                      <option value="03:00 PM - 06:00 PM">Afternoon (03:00 PM - 06:00 PM)</option>
                      <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                    </select>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {/* Totals snippet */}
                <div style={{
                  marginTop: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div className="flex-between" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    <span>Total Bill:</span>
                    <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    marginTop: '10px'
                  }}
                >
                  Continue to Payment <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* STEP 2: Payment Method Selection */}
            {step === 2 && (
              <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Method Swapper */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: paymentMethod === 'card' ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: paymentMethod === 'card' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: paymentMethod === 'card' ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CreditCard size={20} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: paymentMethod === 'cod' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: paymentMethod === 'cod' ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Banknote size={20} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Cash on Delivery</span>
                  </button>
                </div>

                {/* Option A: Card Form + 3D Card Animation */}
                {paymentMethod === 'card' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Visual Card Preview */}
                    <div className="payment-card-wrapper">
                      <div className={`payment-card ${cardFlipped ? 'flipped' : ''}`}>
                        
                        {/* Card Front */}
                        <div className="payment-card-front">
                          <div className="flex-between">
                            <span style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '1rem' }}>GroceryHub Pay</span>
                            <CreditCard size={24} />
                          </div>
                          
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            letterSpacing: '0.15em',
                            margin: '20px 0 10px 0',
                            fontFamily: 'monospace'
                          }}>
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>

                          <div className="flex-between">
                            <div>
                              <div style={{ fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase' }}>Card Holder</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase' }}>
                                {cardName || 'YOUR FULL NAME'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase' }}>Expires</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '500', fontFamily: 'monospace' }}>
                                {cardExpiry || 'MM/YY'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Back */}
                        <div className="payment-card-back">
                          <div style={{ width: '100%', height: '36px', backgroundColor: '#000', margin: '4px 0 10px 0' }}></div>
                          <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <div style={{ marginRight: '8px', fontSize: '0.55rem', textTransform: 'uppercase', opacity: 0.8 }}>CVV</div>
                            <div style={{
                              backgroundColor: '#fff',
                              color: '#000',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace',
                              width: '45px',
                              textAlign: 'center'
                            }}>
                              {cardCvv || '•••'}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          onFocus={() => setCardFlipped(false)}
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
                          Card Number
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          onFocus={() => setCardFlipped(false)}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            onFocus={() => setCardFlipped(false)}
                            style={{
                              width: '100%',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                            CVV
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="123"
                            value={cardCvv}
                            onChange={handleCvvChange}
                            onFocus={() => setCardFlipped(true)}
                            onBlur={() => setCardFlipped(false)}
                            style={{
                              width: '100%',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option B: COD Confirm */}
                {paymentMethod === 'cod' && (
                  <div className="glass-panel animate-fade-in" style={{
                    borderRadius: '16px',
                    padding: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'center',
                    borderStyle: 'dashed'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto'
                    }}>
                      <Banknote size={28} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>Cash on Delivery Selected</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '340px', margin: '0 auto' }}>
                      You will pay the delivery agent in cash or credit card when your fresh order is handed over. No immediate charging is done.
                    </p>
                  </div>
                )}

                {/* Control Row */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '12px' }}
                  >
                    Place Order — ${totalAmount.toFixed(2)}
                  </button>
                </div>

              </form>
            )}

            {/* STEP 3: Order Completed (Success & Receipt download) */}
            {step === 3 && createdOrder && (
              <div className="animate-fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Success Icon */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '50%',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={52} style={{ color: 'var(--primary)' }} />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>
                    Order Placed Successfully!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Thank you for ordering. Your fresh groceries are being gathered.
                  </p>
                </div>

                {/* Receipt Box */}
                <div className="glass-panel" style={{
                  borderRadius: '16px',
                  padding: '20px',
                  backgroundColor: 'var(--bg-secondary)',
                  textAlign: 'left',
                  fontSize: '0.85rem'
                }}>
                  <div className="flex-between" style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ORDER NUMBER</div>
                      <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>{createdOrder._id || createdOrder.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PAYMENT METHOD</div>
                      <div style={{ fontWeight: '700', textTransform: 'uppercase' }}>{createdOrder.paymentMethod}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {createdOrder.items.map((item, idx) => (
                      <div key={idx} className="flex-between">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.name} ({item.quantity} x {item.unit})
                        </span>
                        <span style={{ fontWeight: '500' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr style={{ borderColor: 'var(--border-color)', margin: '8px 0' }} />

                  <div className="flex-between" style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                    <span>Amount Paid</span>
                    <span style={{ color: 'var(--primary)' }}>${createdOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery Timeline Tracker */}
                <div style={{ textAlign: 'left', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>
                    Delivery Progress Tracker
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '8px',
                      right: '8px',
                      height: '2px',
                      backgroundColor: 'var(--border-color)',
                      zIndex: 1
                    }}></div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '4px', fontWeight: '600' }}>Placed</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>2</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Packing</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>3</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Transit</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    onClick={handleDownloadReceipt}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    <Download size={16} /> Receipt
                  </button>
                  <button
                    onClick={onClose}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Close
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
