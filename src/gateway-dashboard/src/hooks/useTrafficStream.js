import { useState, useEffect, useRef, useCallback } from 'react';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000';
const WS_URL = GATEWAY_URL.replace(/^http/, 'ws') + '/ws/traffic';

export function useTrafficStream() {
  const [trafficBuffer, setTrafficBuffer] = useState([]);
  const [latestEvent, setLatestEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Fetch initial stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/gateway/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch gateway stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const statsInterval = setInterval(fetchStats, 2000);

    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      
      ws.onclose = () => {
        setIsConnected(false);
        // Auto reconnect
        setTimeout(connectWebSocket, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init') {
            setTrafficBuffer(msg.data);
          } else if (msg.type === 'traffic') {
            setTrafficBuffer((prev) => [msg.data, ...prev].slice(0, 500));
          } else if (msg.type === 'traffic_start') {
            setLatestEvent(msg.data);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };
    };

    connectWebSocket();

    return () => {
      clearInterval(statsInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchStats]);

  return { trafficBuffer, latestEvent, stats, isConnected };
}
