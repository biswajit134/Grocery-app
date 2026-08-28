import React from 'react';
import { getServiceColor, getServiceName } from '../utils/serviceMapper';
import { Activity, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const MetricsBar = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="glass-panel metrics-bar" style={{ gridColumn: '1 / -1', flexDirection: 'row', justifyContent: 'space-between' }}>
      
      <div className="metric-card">
        <span className="metric-label">Total Requests</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity size={32} color="#8b5cf6" />
          <span className="metric-value">{stats.totalRequests.toLocaleString()}</span>
        </div>
      </div>

      <div className="metric-card">
        <span className="metric-label">Avg Response Time</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Clock size={32} color="#10b981" />
          <span className="metric-value">
            {stats.totalRequests > 0 
              ? Math.round(Object.values(stats.services).reduce((acc, s) => acc + s.avgTime, 0) / Object.keys(stats.services).length) 
              : 0}ms
          </span>
        </div>
      </div>

      <div className="metric-card">
        <span className="metric-label">Global Error Rate</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={32} color={stats.errorRate > 5 ? '#f87171' : '#fbbf24'} />
          <span className="metric-value" style={{ color: stats.errorRate > 5 ? '#f87171' : '#fff' }}>
            {stats.errorRate.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="metric-card">
        <span className="metric-label">Service Distribution</span>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          {['auth', 'products', 'orders'].map(svc => {
            const s = stats.services[svc];
            if (!s) return null;
            return (
              <div key={svc} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: getServiceColor(svc), fontSize: '0.9rem', fontWeight: 600 }}>{s.count}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getServiceName(svc).split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
