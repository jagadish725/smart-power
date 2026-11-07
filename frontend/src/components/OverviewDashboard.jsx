import React from 'react';
import { Zap, Activity, BatteryCharging, Gauge, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function OverviewDashboard({ latestReading, analytics, systemData }) {
  const fan = latestReading?.fan || { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false };
  const led = latestReading?.led || { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false };
  
  const totalPowerMw = latestReading?.total_power_mw || (fan.power_mw + led.power_mw);
  const totalPowerW = (totalPowerMw / 1000).toFixed(2);
  const totalEnergyWh = analytics?.total_energy_wh || 0;
  const totalEnergyKwh = analytics?.total_energy_kwh || 0;
  const isSimulated = Boolean(latestReading?.is_simulated);

  // Maximum rated budget (8.5W = 8500mW)
  const powerBudgetPercent = Math.min(100, Math.round((totalPowerMw / 8500) * 100));

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
        
        {/* Metric 1: Total Power */}
        <div className="glass-panel p-4 rounded relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">TOTAL INSTANTANEOUS POWER</span>
            <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-bold text-slate-100">{totalPowerW}</span>
            <span className="text-sm font-mono text-cyan-400 font-semibold">W</span>
            <span className="text-xs font-mono text-slate-400">({totalPowerMw.toFixed(0)} mW)</span>
          </div>

          {/* Budget progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Safety Budget: 8.5W</span>
              <span>{powerBudgetPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  powerBudgetPercent > 85 ? 'bg-rose-500' : powerBudgetPercent > 65 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${powerBudgetPercent}%` }}
              />
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
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-[#1E2E4A] pt-2">
            <span>Metric in kWh:</span>
            <span className="text-slate-200 font-semibold">{totalEnergyKwh.toFixed(6)} kWh</span>
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
    </div>
  );
}

