import React, { useState } from 'react';
import { Wind, Lightbulb, Power, AlertTriangle, ShieldCheck, Cpu, Gauge, Zap } from 'lucide-react';

export default function DeviceManagement({
  devices,
  latestReading,
  onControlDevice,
  operatingMode
}) {
  const [loadingDeviceId, setLoadingDeviceId] = useState(null);

  const fanDev = devices?.find(d => d.device_id === 'fan') || {
    device_id: 'fan',
    name: '12V DC Brushless Fan',
    voltage_rating: '12V DC',
    relay_pin: 25,
    status: 'OFF',
    is_active: false
  };

  const ledDev = devices?.find(d => d.device_id === 'led') || {
    device_id: 'led',
    name: '12V DC LED Module',
    voltage_rating: '12V DC',
    relay_pin: 26,
    status: 'OFF',
    is_active: false
  };

  const fanTelemetry = latestReading?.fan || { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false };
  const ledTelemetry = latestReading?.led || { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false };

  const isFanActive = fanDev.status === 'ON' || fanTelemetry.relay_on || fanTelemetry.power_mw > 50;
  const isLedActive = ledDev.status === 'ON' || ledTelemetry.relay_on || ledTelemetry.power_mw > 50;

  const handleToggle = async (deviceId, currentStatus) => {
    try {
      setLoadingDeviceId(deviceId);
      const nextAction = currentStatus === 'ON' ? 'OFF' : 'ON';
      await onControlDevice(deviceId, nextAction);
    } catch (err) {
      console.error(`Failed to toggle ${deviceId}:`, err);
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const isAutoMode = operatingMode === 'AUTO';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs sm:text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center space-x-2">
          <span>DEVICE ACTUATORS & RELAY CONTROLS</span>
        </h2>
        {isAutoMode && (
          <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>AI Autonomous Control Active</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Device 1: 12V Brushless Fan */}
        <div className={`glass-panel p-4 sm:p-5 rounded-xl relative overflow-hidden transition-all duration-300 ${
          isFanActive
            ? 'border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.18)] bg-[#0C172B]/90'
            : 'border-[#1E2E4A] hover:border-cyan-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-300 shrink-0 ${
                isFanActive
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}>
                <Wind
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isFanActive ? 'animate-spin text-cyan-300' : ''}`}
                  style={{ animationDuration: isFanActive ? '1.1s' : '0s' }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block">LOAD 1 • GPIO 25</span>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">{fanDev.name}</h3>
                <span className="text-[11px] font-mono text-slate-400 block truncate">INA219 #1 (0x40) • 12V Branch</span>
              </div>
            </div>

            {/* Manual Toggle Switch Button */}
            <button
              onClick={() => handleToggle('fan', fanDev.status)}
              disabled={loadingDeviceId === 'fan'}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border shrink-0 active:scale-95 ${
                fanDev.status === 'ON'
                  ? 'bg-cyan-500 text-black border-cyan-300 shadow-glow-cyan'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500/50'
              } ${loadingDeviceId === 'fan' ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{loadingDeviceId === 'fan' ? 'UPDATING...' : `RELAY ${fanDev.status}`}</span>
            </button>
          </div>

          {/* Tactile Hardware Status Pill */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
            <span className={`px-2 py-0.5 rounded border flex items-center space-x-1.5 ${
              isFanActive
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isFanActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
              <span>{isFanActive ? 'VELOCITY: ~1,850 RPM (ACTIVE)' : 'ROTOR: STATIONARY (0 RPM)'}</span>
            </span>
            <span className="text-slate-500 hidden xs:inline">Brushless DC Motor</span>
          </div>

          {/* Live Telemetry Bar */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#1E2E4A]/80 bg-slate-950/40 p-2 sm:p-2.5 rounded-lg">
            <div>
              <span className="text-[9px] font-mono text-slate-400 block">VOLT</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-100">{fanTelemetry.voltage.toFixed(2)} V</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block">CURRENT</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-100">{fanTelemetry.current_ma.toFixed(0)} mA</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block">POWER</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-cyan-400">{fanTelemetry.power_mw.toFixed(0)} mW</span>
            </div>
          </div>
        </div>

        {/* Device 2: 12V LED Module */}
        <div className={`glass-panel p-4 sm:p-5 rounded-xl relative overflow-hidden transition-all duration-300 ${
          isLedActive
            ? 'border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.18)] bg-[#0C172B]/90'
            : 'border-[#1E2E4A] hover:border-amber-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-300 shrink-0 ${
                isLedActive
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}>
                <Lightbulb
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isLedActive ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : ''}`}
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-amber-400 tracking-wider uppercase block">LOAD 2 • GPIO 26</span>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">{ledDev.name}</h3>
                <span className="text-[11px] font-mono text-slate-400 block truncate">INA219 #2 (0x41) • 12V Branch</span>
              </div>
            </div>

            {/* Manual Toggle Switch Button */}
            <button
              onClick={() => handleToggle('led', ledDev.status)}
              disabled={loadingDeviceId === 'led'}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border shrink-0 active:scale-95 ${
                ledDev.status === 'ON'
                  ? 'bg-amber-500 text-black border-amber-300 shadow-glow-amber'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
              } ${loadingDeviceId === 'led' ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{loadingDeviceId === 'led' ? 'UPDATING...' : `RELAY ${ledDev.status}`}</span>
            </button>
          </div>

          {/* Tactile Hardware Status Pill */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
            <span className={`px-2 py-0.5 rounded border flex items-center space-x-1.5 ${
              isLedActive
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLedActive ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
              <span>{isLedActive ? 'LUMENS: ~240 LM (ILLUMINATING)' : 'EMITTER: DORMANT (0 LM)'}</span>
            </span>
            <span className="text-slate-500 hidden xs:inline">12V Injection Module</span>
          </div>

          {/* Live Telemetry Bar */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#1E2E4A]/80 bg-slate-950/40 p-2 sm:p-2.5 rounded-lg">
            <div>
              <span className="text-[9px] font-mono text-slate-400 block">VOLT</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-100">{ledTelemetry.voltage.toFixed(2)} V</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block">CURRENT</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-100">{ledTelemetry.current_ma.toFixed(0)} mA</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block">POWER</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">{ledTelemetry.power_mw.toFixed(0)} mW</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
