import React, { useState } from 'react';
import { Cpu, Wifi, WifiOff, Cloud, Database, Power, Settings, RefreshCw, LogOut, Shield, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export default function Navbar({
  systemData,
  esp32Online,
  onToggleMode,
  onEmergencyStop,
  onOpenSettings,
  isRefreshing,
  onManualRefresh,
  operatorId = 'ADMIN',
  onLogout
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mode = systemData?.system?.mode || 'MANUAL';
  const supabaseConnected = systemData?.system?.supabase_connected || false;

  return (
    <header className="border-b border-[#1E2E4A] bg-[#0D1524]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Navbar Row */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand / Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Cpu className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-cyan-400 font-bold truncate">PWR//OPT-X1</span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">SCADA</span>
              </div>
              <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-slate-100 truncate">
                <span className="sm:hidden">Smart Power SCADA</span>
                <span className="hidden sm:inline">Smart Power Optimization <span className="text-cyan-400 font-mono text-xs font-normal">AI Agent</span></span>
              </h1>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 shrink-0">
            
            {/* ESP32 Wi-Fi Status (Desktop) */}
            <div className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border ${
              esp32Online
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}>
              {esp32Online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>ESP32: {esp32Online ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Cloud Status (Desktop) */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border bg-slate-900 border-[#1E2E4A] text-slate-300">
              {supabaseConnected ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">SUPABASE</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SQLITE</span>
                </>
              )}
            </div>

            {/* Operating Mode Toggle (Mobile & Desktop) */}
            <button
              onClick={onToggleMode}
              className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border ${
                mode === 'AUTO'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Toggle Operating Mode (AUTO / MANUAL)"
            >
              <span className={`w-2 h-2 rounded-full ${mode === 'AUTO' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{mode}</span>
            </button>

            {/* Manual Telemetry Refresh Button */}
            <button
              onClick={onManualRefresh}
              className={`p-1.5 sm:p-2 rounded bg-slate-900 border border-[#1E2E4A] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors ${
                isRefreshing ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Emergency Killswitch Button */}
            <button
              onClick={onEmergencyStop}
              className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-mono font-bold uppercase bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-glow-rose transition-all active:scale-95"
              title="Emergency Stop: Immediately isolate both loads"
            >
              <Power className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">STOP</span>
            </button>

            {/* Settings Modal Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded bg-slate-900 border border-[#1E2E4A] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
              title="Configure Settings"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Lock / Logout Console Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded text-[11px] sm:text-xs font-mono text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/40 border border-[#1E2E4A] hover:border-rose-500/40 transition-all"
                title="Lock Console & Return to Admin Gate"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">LOCK</span>
              </button>
            )}

            {/* Mobile Drawer Toggle (Small screens only) */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-1.5 rounded bg-slate-900 border border-[#1E2E4A] text-slate-400 hover:text-cyan-400"
              title="Toggle Status Information"
            >
              {mobileDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

          </div>
        </div>

        {/* Mobile Info Strip Drawer (collapsible on phones) */}
        {mobileDrawerOpen && (
          <div className="md:hidden py-2 border-t border-[#1E2E4A] grid grid-cols-2 gap-2 text-[10px] font-mono animate-fadeIn">
            <div className={`flex items-center space-x-1.5 p-1.5 rounded border ${
              esp32Online
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}>
              {esp32Online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>ESP32: {esp32Online ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <div className="flex items-center space-x-1.5 p-1.5 rounded border bg-slate-900 border-[#1E2E4A] text-slate-300">
              <Cloud className="w-3 h-3 text-cyan-400" />
              <span>DB: {supabaseConnected ? 'SUPABASE' : 'SQLITE'}</span>
            </div>

            <div className="col-span-2 flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-[#1E2E4A] text-slate-300">
              <span className="flex items-center space-x-1 text-slate-400">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>OPERATOR:</span>
                <strong className="text-cyan-300">{operatorId}</strong>
              </span>
              <button
                onClick={onLogout}
                className="text-rose-400 hover:text-rose-300 text-[10px] uppercase font-bold flex items-center space-x-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Lock Console</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
