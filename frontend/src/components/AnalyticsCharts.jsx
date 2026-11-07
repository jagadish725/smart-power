import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { LineChart as ChartIcon, Zap, TrendingUp, Award } from 'lucide-react';

export default function AnalyticsCharts({ historyData, analytics }) {
  // Format history data for chart
  const formattedData = (historyData || []).map((item, index) => {
    const timeLabel = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `#${index + 1}`;

    return {
      time: timeLabel,
      fanPower: Math.round(item.fan?.power_mw || 0),
      ledPower: Math.round(item.led?.power_mw || 0),
      totalPower: Math.round(item.total_power_mw || 0),
    };
  });

  const peakPowerMw = analytics?.peak_power_mw || 0;
  const avgPowerMw = analytics?.avg_power_mw || 0;
  const fanEnergyWh = analytics?.fan_energy_wh || 0;
  const ledEnergyWh = analytics?.led_energy_wh || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center space-x-2">
          <ChartIcon className="w-4 h-4 text-cyan-400" />
          <span>REAL-TIME ENERGY & POWER CONSUMPTION TELEMETRY</span>
        </h2>
        <span className="text-[11px] font-mono text-slate-400">
          Showing last {formattedData.length} live samples
        </span>
      </div>

      {/* Main Chart Area */}
      <div className="glass-panel p-5 rounded">
        <div className="h-64 sm:h-72 w-full">
          {formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E4A" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  unit=" mW"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1524',
                    border: '1px solid #1E2E4A',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="fanPower"
                  name="12V Fan (mW)"
                  stroke="#00F0FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFan)"
                />
                <Area
                  type="monotone"
                  dataKey="ledPower"
                  name="5V LED (mW)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLed)"
                />
                <Area
                  type="monotone"
                  dataKey="totalPower"
                  name="Total System (mW)"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center font-mono text-xs text-slate-500">
              Awaiting telemetry streaming from ESP32 or simulation script...
            </div>
          )}
        </div>

        {/* Analytics Breakdown Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1E2E4A]">
          <div className="bg-slate-950/40 p-2.5 rounded border border-[#1E2E4A]/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">PEAK POWER</span>
            <span className="text-base font-mono font-bold text-slate-100">{peakPowerMw.toFixed(0)} mW</span>
            <span className="text-[9px] font-mono text-slate-500 block">({(peakPowerMw / 1000).toFixed(2)} W)</span>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded border border-[#1E2E4A]/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">AVERAGE POWER</span>
            <span className="text-base font-mono font-bold text-slate-100">{avgPowerMw.toFixed(0)} mW</span>
            <span className="text-[9px] font-mono text-slate-500 block">({(avgPowerMw / 1000).toFixed(2)} W)</span>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded border border-[#1E2E4A]/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">FAN ENERGY ACCUMULATED</span>
            <span className="text-base font-mono font-bold text-cyan-400">{fanEnergyWh.toFixed(3)} Wh</span>
            <span className="text-[9px] font-mono text-slate-500 block">12V Circuit</span>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded border border-[#1E2E4A]/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">LED ENERGY ACCUMULATED</span>
            <span className="text-base font-mono font-bold text-amber-400">{ledEnergyWh.toFixed(3)} Wh</span>
            <span className="text-[9px] font-mono text-slate-500 block">5V Circuit</span>
          </div>
        </div>

      </div>
    </div>
  );
}

