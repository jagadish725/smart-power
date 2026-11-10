import React from 'react';
import { Radio, CheckCircle2, XCircle, Clock, Server, Cpu } from 'lucide-react';

export default function SystemStatusBar({
  esp32Online,
  lastTelemetryTime,
  latestReading,
  systemData,
  operatingMode
}) {
  const fanRelay = latestReading?.fan?.relay_on || false;
  const ledRelay = latestReading?.led?.relay_on || false;
  const dbType = systemData?.system?.supabase_connected ? 'SUPABASE' : 'SQLITE';

  return (
    <footer className="mt-8 border-t border-[#1E2E4A] bg-[#0D1524]/80 backdrop-blur py-3 px-4 sm:px-6 lg:px-8 text-[11px] font-mono text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
        
        {/* Left: Hardware Node Status */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${esp32Online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="sm:hidden">ESP32: {esp32Online ? 'ONLINE' : 'OFFLINE'}</span>
            <span className="hidden sm:inline">NODE: ESP32 DevKit V1 ({esp32Online ? 'ONLINE' : 'HEARTBEAT TIMEOUT'})</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Last Telemetry: {lastTelemetryTime ? lastTelemetryTime.toLocaleTimeString() : 'Awaiting data'}</span>
          </div>
        </div>

        {/* Center: Sensor Bus Status */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="text-slate-500">I2C BUS:</span>
            <span className="text-cyan-400">0x40 (Fan)</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">0x41 (LED)</span>
          </span>

          <span className="flex items-center space-x-1">
            <span className="text-slate-500">RELAYS:</span>
            <span className={fanRelay ? 'text-cyan-400' : 'text-slate-500'}>K1(GPIO 25): {fanRelay ? 'ON' : 'OFF'}</span>
            <span className="text-slate-600">•</span>
            <span className={ledRelay ? 'text-amber-400' : 'text-slate-500'}>K2(GPIO 26): {ledRelay ? 'ON' : 'OFF'}</span>
          </span>
        </div>

        {/* Right: Backend & Mode */}
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <Server className="w-3 h-3 text-cyan-400" />
            <span>FLASK :5000 ({dbType})</span>
          </span>

          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-[#1E2E4A] text-slate-300 font-bold">
            {operatingMode}
          </span>
        </div>

      </div>
    </footer>
  );
}

