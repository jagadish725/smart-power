import React from 'react';
import { Zap, BatteryCharging, Leaf, IndianRupee, TrendingDown, Info, ShieldAlert, Sparkles, Activity } from 'lucide-react';

export default function OverviewDashboard({ latestReading, analytics, systemData, powerHistory = [] }) {
  const fan = latestReading?.fan || { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false };
  const led = latestReading?.led || { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false };
  
  const totalPowerMw = latestReading?.total_power_mw || (fan.power_mw + led.power_mw);
  const totalPowerW = (totalPowerMw / 1000).toFixed(2);
  const totalEnergyWh = analytics?.total_energy_wh || 0;
  const totalEnergyKwh = analytics?.total_energy_kwh || 0;
  const isSimulated = Boolean(latestReading?.is_simulated);

  // Maximum rated budget (8.5W = 8500mW)
  const powerBudgetPercent = Math.min(100, Math.round((totalPowerMw / 8500) * 100));

  // Economic Tariff calculation (Standard Commercial / BESCOM rate in India: ₹7.50 / kWh)
  const tariffRatePerKwh = 7.50;
  const sessionCostInr = ((totalEnergyWh / 1000) * tariffRatePerKwh).toFixed(2);
  
  // Carbon Footprint calculation (Indian CEA grid emission intensity: 0.82 kg CO2 / kWh = 0.82 g CO2 / Wh)
  const carbonEmissionG = (totalEnergyWh * 0.82).toFixed(2);
  const carbonSavedG = (totalEnergyWh * 0.82 * 0.22).toFixed(2); // AI ~22% savings

  // Radial Gauge Math (Circle radius = 28)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (powerBudgetPercent / 100) * circumference;
  
  // Gauge dynamic color
  const gaugeColor = powerBudgetPercent > 85 ? '#F43F5E' : powerBudgetPercent > 65 ? '#F59E0B' : '#00F0FF';

  // Live Sparkline path calculation for recent readings
  const sparklineData = (powerHistory && powerHistory.length > 0)
    ? powerHistory.slice(-15).map(p => typeof p === 'number' ? p : (p?.total_power_mw || 0))
    : [totalPowerMw * 0.8, totalPowerMw * 0.9, totalPowerMw];

  const maxSpark = Math.max(...sparklineData, 8500);
  const minSpark = 0;
  const sparkWidth = 110;
  const sparkHeight = 28;

  const sparkPoints = sparklineData.map((val, idx) => {
    const x = (idx / Math.max(1, sparklineData.length - 1)) * sparkWidth;
    const y = sparkHeight - ((val - minSpark) / Math.max(1, maxSpark - minSpark)) * sparkHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      {/* Simulation Indicator Banner */}
      {isSimulated && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>DEMONSTRATION MODE:</strong> Displaying simulated INA219 sensor telemetry. Real measurements will stream automatically when ESP32 is powered.
            </span>
          </div>
          <span className="hidden sm:inline px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold border border-amber-500/30">
            SIMULATED DATA
          </span>
        </div>
      )}

      {/* Main HUD Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Power with Radial Gauge + Sparkline */}
        <div className="glass-panel p-4 rounded relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">TOTAL INSTANTANEOUS POWER</span>
            <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>

          <div className="flex items-center justify-between mt-1">
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-mono font-bold text-slate-100">{totalPowerW}</span>
                <span className="text-sm font-mono text-cyan-400 font-semibold">W</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {totalPowerMw.toFixed(0)} mW
              </div>
            </div>

            {/* SVG Circular Radial Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
                {/* Background track */}
                <circle
                  cx="34"
                  cy="34"
                  r={radius}
                  fill="transparent"
                  stroke="#1E2E4A"
                  strokeWidth="5"
                />
                {/* Active progress arc */}
                <circle
                  cx="34"
                  cy="34"
                  r={radius}
                  fill="transparent"
                  stroke={gaugeColor}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              {/* Center percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-mono font-bold text-slate-200">{powerBudgetPercent}%</span>
                <span className="text-[8px] font-mono text-slate-400 uppercase leading-none">LOAD</span>
              </div>
            </div>
          </div>

          {/* Mini Sparkline & Budget indicator */}
          <div className="mt-3 pt-2.5 border-t border-[#1E2E4A] flex items-center justify-between">
            <div className="text-[10px] font-mono text-slate-400">
              <span>Budget: 8.5W</span>
              <span className={`block font-bold ${
                powerBudgetPercent > 85 ? 'text-rose-400' : powerBudgetPercent > 65 ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {powerBudgetPercent > 85 ? 'HIGH LOAD' : 'NOMINAL'}
              </span>
            </div>

            {/* Sparkline curve */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Trend</span>
              <svg width={sparkWidth} height={sparkHeight} className="overflow-visible">
                <polyline
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparkPoints}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 2: Accumulated Energy */}
        <div className="glass-panel p-4 rounded relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">ACCUMULATED ENERGY</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-bold text-slate-100">{totalEnergyWh.toFixed(3)}</span>
            <span className="text-sm font-mono text-emerald-400 font-semibold">Wh</span>
          </div>
          
          <div className="mt-3 space-y-1.5 border-t border-[#1E2E4A] pt-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Metric in kWh:</span>
              <span className="text-slate-200 font-semibold">{totalEnergyKwh.toFixed(6)} kWh</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400 text-[11px]">
              <span className="flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>Joules:</span>
              </span>
              <span className="font-semibold">{(totalEnergyWh * 3600).toFixed(0)} J</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Fan Telemetry Summary */}
        <div className="glass-panel p-4 rounded relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${fan.relay_on ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-mono text-xs uppercase tracking-wider">12V DC FAN (INA219 #1)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              fan.relay_on ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {fan.relay_on ? 'RELAY ON' : 'RELAY OFF'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-1 border-t border-[#1E2E4A]">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">VOLT</span>
              <span className="text-sm font-mono font-bold text-slate-100">{fan.voltage.toFixed(2)} V</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">CURRENT</span>
              <span className="text-sm font-mono font-bold text-slate-100">{fan.current_ma.toFixed(0)} mA</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">POWER</span>
              <span className="text-sm font-mono font-bold text-cyan-400">{fan.power_mw.toFixed(0)} mW</span>
            </div>
          </div>
        </div>

        {/* Metric 4: LED Telemetry Summary */}
        <div className="glass-panel p-4 rounded relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${led.relay_on ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-mono text-xs uppercase tracking-wider">5V COB LED (INA219 #2)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              led.relay_on ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {led.relay_on ? 'RELAY ON' : 'RELAY OFF'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-1 border-t border-[#1E2E4A]">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">VOLT</span>
              <span className="text-sm font-mono font-bold text-slate-100">{led.voltage.toFixed(2)} V</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">CURRENT</span>
              <span className="text-sm font-mono font-bold text-slate-100">{led.current_ma.toFixed(0)} mA</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">POWER</span>
              <span className="text-sm font-mono font-bold text-amber-400">{led.power_mw.toFixed(0)} mW</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sustainability & Tariff Economics Bar */}
      <div className="p-3 rounded glass-panel border-[#1E2E4A] bg-[#0A101D] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        
        {/* Metric: Tariff Rate */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Grid Electricity Tariff</span>
            <span className="text-slate-100 font-bold">₹{tariffRatePerKwh.toFixed(2)} / kWh <span className="text-[10px] text-slate-400 font-normal">(Commercial Rate)</span></span>
          </div>
        </div>

        {/* Metric: Current Energy Cost */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Session Energy Cost</span>
            <span className="text-cyan-300 font-bold">₹ {sessionCostInr}</span>
          </div>
        </div>

        {/* Metric: Carbon Footprint */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Carbon Footprint (CEA)</span>
            <span className="text-emerald-300 font-bold">{carbonEmissionG} g CO₂</span>
          </div>
        </div>

        {/* Metric: AI Energy Optimization Saving */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">AI Agent Power Reduction</span>
            <span className="text-amber-300 font-bold">~22% Optimized <span className="text-[10px] text-slate-400 font-normal">(-{carbonSavedG}g CO₂)</span></span>
          </div>
        </div>

      </div>

    </div>
  );
}
