import React from 'react';

export const TrafficFeed = ({ trafficBuffer }) => {
  return (
    <div className="glass-panel traffic-feed">
      <div className="panel-header">
        Live Traffic Feed
      </div>
      <div className="feed-list">
        {trafficBuffer.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            No traffic captured yet...
          </div>
        ) : (
          trafficBuffer.map((log) => {
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            let statusClass = 'status-2xx';
            if (log.statusCode >= 400 && log.statusCode < 500) statusClass = 'status-4xx';
            if (log.statusCode >= 500) statusClass = 'status-5xx';

            return (
              <div key={log.id} className="log-entry">
                <span className="log-time">{time}</span>
                <span className={`log-method method-${log.method}`}>{log.method}</span>
                <span className="log-path" title={log.path}>{log.path}</span>
                <span className={`log-status ${statusClass}`}>{log.statusCode}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
