import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertOctagon, CheckCircle2, Zap, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Cpu, Sparkles } from 'lucide-react';
import api from '../services/api';

export const SCENARIO_PRESETS = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Nominal Load',
    badge: 'NORMAL (3.1W)',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
    fan: { voltage: 11.51, current_ma: 125, power_mw: 1438, relay_on: true },
    led: { voltage: 11.52, current_ma: 135, power_mw: 1555, relay_on: true },
    total_power_mw: 2993,
    classification: 'NORMAL',
    confidence: 97.4,
    reason: 'Both 12V loads operating within normal steady-state parameters. Fan cooling active; LED illumination steady.',
    recommendation: 'Maintain active state. Nominal energy consumption.'
  },
  HIGH_CONSUMPTION: {
    id: 'HIGH_CONSUMPTION',
    name: 'Heavy Load',
    badge: 'HIGH LOAD (7.5W)',
    badgeColor: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
    fan: { voltage: 11.45, current_ma: 365, power_mw: 4179, relay_on: true },
    led: { voltage: 11.42, current_ma: 285, power_mw: 3254, relay_on: true },
    total_power_mw: 7433,
    classification: 'HIGH_CONSUMPTION',
    confidence: 94.8,
    reason: 'Combined load approaches 8.5W safety threshold (87% budget). Elevated thermal dissipation detected.',
    recommendation: 'Optimization advised: Recommend throttling LED or switching non-critical load to standby.'
  },
  ABNORMAL: {
    id: 'ABNORMAL',
    name: 'Motor Stall / Fault',
    badge: 'ANOMALY (>10W)',
    badgeColor: 'border-rose-500/60 bg-rose-950/50 text-rose-300 animate-pulse',
    fan: { voltage: 11.20, current_ma: 825, power_mw: 9240, relay_on: true },
    led: { voltage: 11.38, current_ma: 130, power_mw: 1479, relay_on: true },
    total_power_mw: 10719,
    classification: 'ABNORMAL',
    confidence: 99.2,
    reason: 'Fan current spike (825mA) indicates rotor stall or mechanical bearing friction. Safety threshold exceeded.',
    recommendation: 'SAFETY TRIP TRIGGERED: Immediate relay K1 isolation command recommended.'
  },
  IDLE: {
    id: 'IDLE',
    name: 'Standby / Idle',
    badge: 'IDLE (0.0W)',
    badgeColor: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300',
    fan: { voltage: 0.0, current_ma: 0, power_mw: 0, relay_on: false },
    led: { voltage: 0.0, current_ma: 0, power_mw: 0, relay_on: false },
    total_power_mw: 0,
    classification: 'IDLE',
    confidence: 98.0,
    reason: 'Quiescent baseline. Zero active load draw on dual 12V channels.',
    recommendation: 'Continuous telemetry monitoring. System awaiting load activation.'
  }
};

export default function ScenarioSimulator({ onInjectTelemetry, isOfflineMode, onForceRefresh }) {
  const [activeScenario, setActiveScenario] = useState('NORMAL');
  const [isAutoStreaming, setIsAutoStreaming] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const autoStreamIntervalRef = useRef(null);

  // Apply a scenario
  const triggerScenario = async (scenarioKey, applyJitter = false) => {
    const preset = SCENARIO_PRESETS[scenarioKey];
    if (!preset) return;

    setActiveScenario(scenarioKey);
    setIsInjecting(true);

    // Realistic sensor jitter for live feel
    const jitter = applyJitter ? (Math.random() * 0.04 - 0.02) : 0;
    const fanCurrentJitter = applyJitter ? Math.round(Math.random() * 8 - 4) : 0;
    const ledCurrentJitter = applyJitter ? Math.round(Math.random() * 6 - 3) : 0;

    const fanVolts = preset.fan.voltage > 0 ? +(preset.fan.voltage + jitter).toFixed(2) : 0;
    const fanCurrent = preset.fan.current_ma > 0 ? Math.max(1, preset.fan.current_ma + fanCurrentJitter) : 0;
    const fanPower = +(fanVolts * fanCurrent).toFixed(0);

    const ledVolts = preset.led.voltage > 0 ? +(preset.led.voltage + jitter).toFixed(2) : 0;
    const ledCurrent = preset.led.current_ma > 0 ? Math.max(1, preset.led.current_ma + ledCurrentJitter) : 0;
    const ledPower = +(ledVolts * ledCurrent).toFixed(0);

    const totalPower = fanPower + ledPower;

    const simulatedPayload = {
      fan: {
        voltage: fanVolts,
        current_ma: fanCurrent,
        power_mw: fanPower,
        relay_on: preset.fan.relay_on
      },
      led: {
        voltage: ledVolts,
        current_ma: ledCurrent,
        power_mw: ledPower,
        relay_on: preset.led.relay_on
      },
      total_power_mw: totalPower,
      is_simulated: true,
      timestamp: new Date().toISOString()
    };

    const simulatedDecision = {
      classification: preset.classification,
      confidence: preset.confidence,
      reason: preset.reason,
      recommendation: preset.recommendation,
      suggested_action: preset.classification === 'ABNORMAL' ? 'EMERGENCY_STOP' : preset.classification === 'HIGH_CONSUMPTION' ? 'THROTTLE' : 'KEEP',
      action_taken: preset.classification === 'ABNORMAL' ? 'ISOLATION_RECOMMENDED' : 'MONITORED',
      timestamp: new Date().toISOString()
    };

    if (onInjectTelemetry) {
      onInjectTelemetry(simulatedPayload, simulatedDecision);
    }

    if (!isOfflineMode) {
      try {
        await api.postReading(simulatedPayload);
        if (onForceRefresh) onForceRefresh();
      } catch (err) {
        // Handled silently
      }
    }

    setTimeout(() => setIsInjecting(false), 300);
  };

  useEffect(() => {
    if (isAutoStreaming) {
      const scenarios = ['NORMAL', 'HIGH_CONSUMPTION', 'NORMAL', 'IDLE'];
      let idx = 0;
      autoStreamIntervalRef.current = setInterval(() => {
        triggerScenario(scenarios[idx % scenarios.length], true);
        idx++;
      }, 3000);
    } else {
      if (autoStreamIntervalRef.current) {
        clearInterval(autoStreamIntervalRef.current);
      }
    }
    return () => {
      if (autoStreamIntervalRef.current) clearInterval(autoStreamIntervalRef.current);
    };
  }, [isAutoStreaming]);

  return (
    <div className="glass-panel p-3.5 sm:p-4 rounded-xl border-cyan-500/30 bg-[#0E1626]/90 relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-500 opacity-70" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100 uppercase truncate">
                Examiner & Viva Scenario Simulator
              </span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                INTERACTIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
              Inject live load states into AI Classifier & SCADA gauges without physical rewiring
            </p>
          </div>
        </div>

        {/* Action Controls: 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          
          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {Object.entries(SCENARIO_PRESETS).map(([key, sc]) => {
              const isSelected = activeScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => triggerScenario(key, false)}
                  className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-semibold transition-all duration-200 border flex items-center justify-center space-x-1.5 active:scale-95 ${
                    isSelected
                      ? `${sc.badgeColor} ring-1 ring-cyan-400/50 scale-[1.01]`
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="truncate">{sc.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: Auto-Stream & Defense Notes Toggle */}
          <div className="flex items-center space-x-2">
            {/* Auto-Cycle Stream Toggle */}
            <button
              onClick={() => setIsAutoStreaming(!isAutoStreaming)}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase transition-all duration-200 border flex items-center justify-center space-x-1.5 active:scale-95 ${
                isAutoStreaming
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-glow-emerald animate-pulse'
                  : 'bg-slate-900 border-[#1E2E4A] text-slate-300 hover:border-cyan-500/40'
              }`}
              title="Automatically stream alternating live telemetry"
            >
              {isAutoStreaming ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isAutoStreaming ? 'STREAMING...' : 'AUTO-STREAM'}</span>
            </button>

            {/* Viva Defense Guide Toggle */}
            <button
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="p-2 sm:p-1.5 rounded-lg bg-slate-900 border border-[#1E2E4A] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0"
              title="Toggle Viva Defense Points & Technical Notes"
            >
              {showCheatSheet ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Viva Defense Reference Drawer */}
      {showCheatSheet && (
        <div className="mt-3.5 pt-3 border-t border-[#1E2E4A] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono animate-fadeIn">
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-cyan-400 uppercase block font-semibold">1. Dual INA219 Sensors</span>
            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
              • Fan sensor at I2C <strong className="text-cyan-300">0x40</strong><br/>
              • LED sensor at I2C <strong className="text-cyan-300">0x41</strong> (A0 bridged)<br/>
              • Real-time high-side V, mA & mW.
            </p>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase block font-semibold">2. Safety Thresholds</span>
            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
              • Total budget: <strong className="text-amber-300">8.5W (8500 mW)</strong><br/>
              • Fan trip limit: 6.0W<br/>
              • Dual 12V shared bus isolation.
            </p>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase block font-semibold">3. AI Classifier Architecture</span>
            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
              • <strong>Random Forest Classifier</strong> (100 Trees)<br/>
              • OODA Loop: Observe → Analyse → Decide → Act<br/>
              • Fallback: Deterministic safety engine.
            </p>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-rose-400 uppercase block font-semibold">4. Cloud & SCADA Sync</span>
            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
              • Dual DB: Supabase Cloud PostgreSQL + Local SQLite<br/>
              • REST telemetry ingestion (2.0s loop)<br/>
              • Commercial Tariff: ₹7.50 / kWh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
