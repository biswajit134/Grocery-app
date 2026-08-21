const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Proxy endpoints
app.use('/api/auth', createProxyMiddleware({ 
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:5001', 
  changeOrigin: true 
}));

app.use('/api/products', createProxyMiddleware({ 
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002', 
  changeOrigin: true 
}));

app.use('/api/orders', createProxyMiddleware({ 
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:5003', 
  changeOrigin: true 
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
