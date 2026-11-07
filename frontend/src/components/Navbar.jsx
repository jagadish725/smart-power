import React from 'react';
import { Cpu, Wifi, WifiOff, Cloud, Database, Power, AlertTriangle, Settings, RefreshCw } from 'lucide-react';

export default function Navbar({
  systemData,
  esp32Online,
  onToggleMode,
  onEmergencyStop,
  onOpenSettings,
  isRefreshing,
  onManualRefresh
}) {
  const mode = systemData?.system?.mode || 'MANUAL';
  const supabaseConnected = systemData?.system?.supabase_connected || false;

  return (
    <header className="border-b border-[#1E2E4A] bg-[#0D1524]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">PWR//OPT-X1</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 text-cyan-300 font-mono">SCADA NODE</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100">
              Smart Power Optimization <span className="text-cyan-400 font-mono text-xs font-normal">AI Agent</span>
            </h1>
          </div>
        </div>

        {/* Telemetry Pips & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* ESP32 Wi-Fi Status */}
          <div className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border ${
            esp32Online
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
          }`}>
            {esp32Online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>ESP32: {esp32Online ? 'ONLINE' : 'DISCONNECTED'}</span>
          </div>

          {/* Database Mode Status */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border bg-slate-900 border-[#1E2E4A] text-slate-300">
            {supabaseConnected ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">SUPABASE CLOUD</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>SQLITE LOCAL</span>
              </>
            )}
          </div>

          {/* AUTO / MANUAL Mode Toggle */}
          <button
            onClick={onToggleMode}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border ${
              mode === 'AUTO'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Toggle between Autonomous AI Optimization and Manual Operator Control"
          >
            <span className={`w-2 h-2 rounded-full ${mode === 'AUTO' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`} />
            <span>MODE: {mode}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={onManualRefresh}
            className={`p-2 rounded bg-slate-900 border border-[#1E2E4A] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Refresh telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Emergency Killswitch */}
          <button
            onClick={onEmergencyStop}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-glow-rose transition-all"
            title="Emergency Stop: Immediately cuts power to both Fan and LED loads"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KILLSWITCH</span>
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded bg-slate-900 border border-[#1E2E4A] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            title="Configure System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}

