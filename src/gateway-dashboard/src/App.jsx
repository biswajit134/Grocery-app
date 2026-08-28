import React from 'react';
import { useTrafficStream } from './hooks/useTrafficStream';
import { TopologyMap } from './components/TopologyMap';
import { TrafficFeed } from './components/TrafficFeed';
import { MetricsBar } from './components/MetricsBar';
import { ResponseChart } from './components/ResponseChart';
import { Server } from 'lucide-react';

function App() {
  const { trafficBuffer, latestEvent, stats, isConnected } = useTrafficStream();

  return (
    <div className="dashboard-container">
      {/* Header spanning full width */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Server color="#06b6d4" size={28} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
            GroceryHub <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>API Gateway</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ 
            width: '10px', height: '10px', borderRadius: '50%', 
            backgroundColor: isConnected ? '#10b981' : '#f87171',
            boxShadow: isConnected ? '0 0 10px #10b981' : '0 0 10px #f87171'
          }}></div>
          <span style={{ color: isConnected ? '#10b981' : '#f87171' }}>
            {isConnected ? 'LIVE (WS Connected)' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Top Metrics Bar */}
      <MetricsBar stats={stats} />

      {/* Main Map */}
      <TopologyMap latestEvent={latestEvent} />

      {/* Traffic Log sidebar */}
      <TrafficFeed trafficBuffer={trafficBuffer} />

      {/* Bottom Chart */}
      <ResponseChart trafficBuffer={trafficBuffer} />
      
    </div>
  );
}

export default App;
