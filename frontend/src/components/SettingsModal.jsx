import React from 'react';
import { X, Sliders, Shield, Cloud, Wifi, Check, AlertCircle } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  systemData,
  operatingMode,
  onToggleMode
}) {
  if (!isOpen) return null;

  const isSupabase = systemData?.system?.supabase_connected || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel-elevated w-full max-w-xl rounded-lg p-6 border-cyan-500/40 relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2E4A]">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-mono">SYSTEM CONFIGURATION & HARDWARE SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 pt-4 text-xs font-mono text-slate-300">
          
          {/* Section 1: Operating Mode */}
          <div className="p-4 rounded bg-slate-900/60 border border-[#1E2E4A]">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-bold">
              1. AUTONOMOUS VS MANUAL OPERATING MODE
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 font-semibold mb-1">
                  Current Mode: <span className="text-cyan-400 font-bold">{operatingMode}</span>
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {operatingMode === 'AUTO'
                    ? 'AI Agent automatically regulates relay actuators based on safety thresholds.'
                    : 'Operator retains full manual control. AI acts solely as an advisory observer.'}
                </p>
              </div>
              <button
                onClick={onToggleMode}
                className="px-4 py-2 rounded font-bold uppercase text-xs border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all shrink-0 ml-4"
              >
                Switch to {operatingMode === 'AUTO' ? 'MANUAL' : 'AUTO'}
              </button>
            </div>
          </div>

          {/* Section 2: Configured Safety Thresholds */}
          <div className="p-4 rounded bg-slate-900/60 border border-[#1E2E4A]">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-bold flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>2. HARDWARE PROTECTION THRESHOLDS (CONFIGURABLE)</span>
            </span>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950 p-2.5 rounded border border-[#1E2E4A]/80">
                <span className="text-[10px] text-slate-400 block">FAN TRIP LIMIT</span>
                <span className="text-sm font-bold text-slate-100">6,000 mW</span>
                <span className="text-[9px] text-slate-500 block">12V @ 500mA</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-[#1E2E4A]/80">
                <span className="text-[10px] text-slate-400 block">LED TRIP LIMIT</span>
                <span className="text-sm font-bold text-slate-100">3,500 mW</span>
                <span className="text-[9px] text-slate-500 block">5V @ 700mA</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-[#1E2E4A]/80">
                <span className="text-[10px] text-slate-400 block">TOTAL BUDGET</span>
                <span className="text-sm font-bold text-cyan-400">8,500 mW</span>
                <span className="text-[9px] text-slate-500 block">Combined Max</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Values can be fine-tuned in <code className="text-cyan-400">backend/.env</code>.
            </p>
          </div>

          {/* Section 3: Supabase Cloud Integration */}
          <div className="p-4 rounded bg-slate-900/60 border border-[#1E2E4A]">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-bold flex items-center space-x-1.5">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>3. SUPABASE CLOUD DATABASE CONNECTION</span>
            </span>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isSupabase ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="font-semibold text-slate-200">
                Status: {isSupabase ? 'CONNECTED TO SUPABASE' : 'USING LOCAL SQLITE FALLBACK'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
              To connect your Supabase project:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-[#1E2E4A]">
              <li>Paste your <code className="text-cyan-400">SUPABASE_URL</code> and <code className="text-cyan-400">SUPABASE_KEY</code> in <code className="text-cyan-400">backend/.env</code>.</li>
              <li>Open your Supabase SQL Editor and execute the schema script located at <code className="text-cyan-400">backend/database/supabase_schema.sql</code>.</li>
              <li>Restart the Flask backend — it will automatically detect and stream all telemetry to your cloud database!</li>
            </ol>
          </div>

          {/* Section 4: ESP32 Wi-Fi & IP Address Reminder */}
          <div className="p-4 rounded bg-slate-900/60 border border-[#1E2E4A]">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-bold flex items-center space-x-1.5">
              <Wifi className="w-4 h-4 text-amber-400" />
              <span>4. ESP32 NETWORK CONFIGURATION</span>
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Ensure your ESP32 is flashed with your laptop's local IPv4 address (not localhost) in <code className="text-cyan-400">esp32/firmware/config.h</code>.
            </p>
            <div className="mt-2 bg-slate-950 p-2.5 rounded border border-[#1E2E4A] text-[11px] text-slate-400">
              On Windows CMD: run <code className="text-amber-300">ipconfig</code> → copy your <strong>IPv4 Address</strong> (e.g. 192.168.1.15).
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-[#1E2E4A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
}

