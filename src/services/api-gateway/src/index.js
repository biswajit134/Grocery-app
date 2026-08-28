const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());

// --- Traffic Monitoring System ---
const TRAFFIC_BUFFER_SIZE = 500;
const trafficBuffer = [];
let totalRequests = 0;
const serviceStats = {
  auth: { count: 0, errors: 0, totalTime: 0 },
  products: { count: 0, errors: 0, totalTime: 0 },
  orders: { count: 0, errors: 0, totalTime: 0 },
  unknown: { count: 0, errors: 0, totalTime: 0 }
};

const wss = new WebSocketServer({ server, path: '/ws/traffic' });

wss.on('connection', (ws) => {
  console.log('Dashboard client connected to WebSocket');
  ws.send(JSON.stringify({ type: 'init', data: trafficBuffer }));
});

const broadcastMessage = (msgObj) => {
  console.log('Broadcasting message:', JSON.stringify(msgObj));
  const message = JSON.stringify(msgObj);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
};

const identifyClient = (req) => {
  const referer = req.get('Referer') || req.get('Origin') || '';
  if (referer.includes('3000')) return 'frontend';
  if (referer.includes('3001')) return 'delivery';
  if (referer.includes('3002')) return 'vendor';
  if (referer.includes('3003')) return 'admin';
  return 'unknown';
};

const identifyTargetService = (path) => {
  if (path.startsWith('/api/auth')) return 'auth';
  if (path.startsWith('/api/products')) return 'products';
  if (path.startsWith('/api/orders')) return 'orders';
  return 'unknown';
};

const trafficMiddleware = (req, res, next) => {
  // Skip logging for the dashboard endpoints
  if (req.path.startsWith('/api/gateway')) {
    return next();
  }

  const id = Math.random().toString(36).substring(2, 11);
  const startTime = Date.now();
  const client = identifyClient(req);
  const target = identifyTargetService(req.path);

  // Broadcast immediate start event for live animations
  broadcastMessage({
    type: 'traffic_start',
    data: { id, client, target }
  });

  // Hook into response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    const trafficEntry = {
      id,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      client,
      target
    };

    // Update Buffer
    trafficBuffer.unshift(trafficEntry);
    if (trafficBuffer.length > TRAFFIC_BUFFER_SIZE) {
      trafficBuffer.pop();
    }

    // Update Stats
    totalRequests++;
    if (serviceStats[target]) {
      serviceStats[target].count++;
      serviceStats[target].totalTime += duration;
      if (isError) serviceStats[target].errors++;
    }

    // Broadcast real-time completion
    broadcastMessage({
      type: 'traffic',
      data: trafficEntry
    });
  });

  next();
};

app.use(trafficMiddleware);
// ---------------------------------

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

// Dashboard Endpoints
app.get('/api/gateway/traffic', (req, res) => {
  res.json(trafficBuffer);
});

app.get('/api/gateway/stats', (req, res) => {
  const stats = {
    totalRequests,
    services: {},
    errorRate: 0
  };
  
  let totalErrors = 0;
  
  Object.keys(serviceStats).forEach(svc => {
    const s = serviceStats[svc];
    totalErrors += s.errors;
    stats.services[svc] = {
      count: s.count,
      errorRate: s.count > 0 ? (s.errors / s.count) * 100 : 0,
      avgTime: s.count > 0 ? s.totalTime / s.count : 0
    };
  });
  
  stats.errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  
  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

server.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
