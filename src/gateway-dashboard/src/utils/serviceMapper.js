export const serviceConfig = {
  auth: {
    id: 'auth',
    name: 'Auth Service',
    color: '#06b6d4', // Cyan
    port: 5001,
  },
  products: {
    id: 'products',
    name: 'Product Service',
    color: '#10b981', // Emerald
    port: 5002,
  },
  orders: {
    id: 'orders',
    name: 'Order Service',
    color: '#f97316', // Orange
    port: 5003,
  },
  frontend: {
    id: 'frontend',
    name: 'Storefront',
    color: '#8b5cf6', // Violet
  },
  admin: {
    id: 'admin',
    name: 'Admin Portal',
    color: '#ec4899', // Pink
  },
  vendor: {
    id: 'vendor',
    name: 'Vendor Hub',
    color: '#f59e0b', // Amber
  },
  delivery: {
    id: 'delivery',
    name: 'Driver App',
    color: '#3b82f6', // Blue
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
    color: '#6b7280', // Gray
  }
};

export const getServiceColor = (serviceId) => {
  return serviceConfig[serviceId]?.color || serviceConfig.unknown.color;
};

export const getServiceName = (serviceId) => {
  return serviceConfig[serviceId]?.name || 'Unknown';
};
