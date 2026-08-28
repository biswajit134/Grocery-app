import React, { useEffect, useState } from 'react';
import { getServiceColor, getServiceName } from '../utils/serviceMapper';

export const TopologyMap = ({ trafficBuffer }) => {
  const [animations, setAnimations] = useState([]);
  const [nodeActivity, setNodeActivity] = useState({});

  useEffect(() => {
    if (!trafficBuffer || trafficBuffer.length === 0) return;
    
    // Get the latest request
    const latest = trafficBuffer[0];
    const now = Date.now();
    
    // Add animation for this request
    const newAnim = {
      id: latest.id,
      client: latest.client,
      target: latest.target,
      duration: latest.duration,
      startTime: now
    };
    
    setAnimations(prev => [...prev.slice(-20), newAnim]);
    
    // Set node activity for glow effects
    setNodeActivity(prev => ({
      ...prev,
      [latest.client]: now,
      [latest.target]: now,
      gateway: now
    }));

  }, [trafficBuffer]);

  // Clean up old animations and node activities
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAnimations(prev => prev.filter(a => now - a.startTime < 2000));
      
      setNodeActivity(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (now - next[key] > 1000) {
            delete next[key];
          }
        });
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const isNodeActive = (id) => !!nodeActivity[id];

  // Map coordinates (relative to 800x400 viewBox)
  const nodes = {
    frontend: { x: 100, y: 50 },
    delivery: { x: 100, y: 150 },
    vendor: { x: 100, y: 250 },
    admin: { x: 100, y: 350 },
    gateway: { x: 400, y: 200 },
    auth: { x: 700, y: 100 },
    products: { x: 700, y: 200 },
    orders: { x: 700, y: 300 }
  };

  const renderNode = (id, label, icon) => {
    const { x, y } = nodes[id];
    const isActive = isNodeActive(id);
    const color = getServiceColor(id);
    const isGateway = id === 'gateway';

    return (
      <g key={id} transform={`translate(${x}, ${y})`}>
        {isActive && (
          <circle 
            className="sonar-circle" 
            cx="0" cy="0" r="25" 
            stroke={color} 
          />
        )}
        <circle 
          className={isGateway ? (isActive ? 'gateway-heartbeat' : '') : (isActive ? 'node-active' : '')}
          cx="0" cy="0" r={isGateway ? 40 : 25}
          fill="rgba(20, 20, 25, 0.9)"
          stroke={color}
          strokeWidth="3"
          style={{ color }}
        />
        <text 
          x="0" y={isGateway ? 60 : 45} 
          textAnchor="middle" 
          fill="#e5e7eb" 
          fontSize="12"
          fontWeight="500"
        >
          {label}
        </text>
        {isGateway && (
          <text x="0" y="5" textAnchor="middle" fill={color} fontSize="20" fontWeight="bold">
            API
          </text>
        )}
      </g>
    );
  };

  const renderConnection = (fromId, toId, animated = false) => {
    const from = nodes[fromId];
    const to = nodes[toId];
    if (!from || !to) return null;

    return (
      <path
        key={`${fromId}-${toId}`}
        d={`M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y}, ${(from.x + to.x) / 2} ${to.y}, ${to.x} ${to.y}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="2"
      />
    );
  };

  const renderAnimation = (anim) => {
    const fromClient = nodes[anim.client] || nodes.unknown;
    const gateway = nodes.gateway;
    const toTarget = nodes[anim.target] || nodes.unknown;
    
    if (!fromClient || !toTarget) return null;

    const clientColor = getServiceColor(anim.client);
    const targetColor = getServiceColor(anim.target);
    
    // Speed based on duration (faster = lower latency)
    const animDuration = Math.max(0.5, Math.min(2, anim.duration / 100));

    return (
      <g key={anim.id}>
        {/* Outside Traffic (Incoming): Laser pulse */}
        <path
          d={`M ${fromClient.x} ${fromClient.y} C ${(fromClient.x + gateway.x) / 2} ${fromClient.y}, ${(fromClient.x + gateway.x) / 2} ${gateway.y}, ${gateway.x} ${gateway.y}`}
          className="laser-beam"
          stroke={clientColor}
          style={{ animationDuration: `${animDuration}s` }}
        />
        {/* Inside Traffic (Outgoing): Data packet */}
        <path
          d={`M ${gateway.x} ${gateway.y} C ${(gateway.x + toTarget.x) / 2} ${gateway.y}, ${(gateway.x + toTarget.x) / 2} ${toTarget.y}, ${toTarget.x} ${toTarget.y}`}
          className="data-packet"
          stroke={targetColor}
          style={{ animationDuration: `${animDuration}s`, animationDelay: `${animDuration * 0.3}s` }}
        />
      </g>
    );
  };

  return (
    <div className="glass-panel topology-container">
      <div className="panel-header" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
        Live Topology Map
      </div>
      <svg className="topology-svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
        {/* Connections (Clients -> Gateway) */}
        {['frontend', 'delivery', 'vendor', 'admin'].map(client => renderConnection(client, 'gateway'))}
        
        {/* Connections (Gateway -> Services) */}
        {['auth', 'products', 'orders'].map(service => renderConnection('gateway', service))}

        {/* Live Animations */}
        {animations.map(renderAnimation)}

        {/* Client Nodes */}
        {renderNode('frontend', 'Storefront')}
        {renderNode('delivery', 'Driver App')}
        {renderNode('vendor', 'Vendor Hub')}
        {renderNode('admin', 'Admin Portal')}

        {/* Backend Services */}
        {renderNode('auth', 'Auth Service')}
        {renderNode('products', 'Product Service')}
        {renderNode('orders', 'Order Service')}

        {/* API Gateway */}
        {renderNode('gateway', 'API Gateway')}
      </svg>
    </div>
  );
};
