import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const ResponseChart = ({ trafficBuffer }) => {
  // Process the buffer into time buckets for the chart
  const chartData = useMemo(() => {
    if (!trafficBuffer || trafficBuffer.length === 0) return [];

    // Take last 50 requests and group them by 5-second buckets
    const recentTraffic = [...trafficBuffer].reverse().slice(-100);
    const buckets = {};

    recentTraffic.forEach(log => {
      const d = new Date(log.timestamp);
      // Round to nearest 5 seconds
      const coeff = 1000 * 5;
      const rounded = new Date(Math.round(d.getTime() / coeff) * coeff);
      const timeStr = rounded.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });

      if (!buckets[timeStr]) {
        buckets[timeStr] = { time: timeStr, sum: 0, count: 0, max: 0 };
      }
      buckets[timeStr].sum += log.duration;
      buckets[timeStr].count += 1;
      buckets[timeStr].max = Math.max(buckets[timeStr].max, log.duration);
    });

    return Object.values(buckets).map(b => ({
      time: b.time,
      avgResponse: Math.round(b.sum / b.count),
      maxResponse: b.max
    }));
  }, [trafficBuffer]);

  return (
    <div className="glass-panel chart-container">
      <div className="panel-header">
        Response Time Latency (Live)
      </div>
      <div style={{ flex: 1, width: '100%', height: '100%', minHeight: '180px' }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickMargin={8} />
            <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `${val}ms`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(20, 20, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Area 
              type="monotone" 
              dataKey="avgResponse" 
              name="Avg Time"
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorAvg)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
