import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import OverviewDashboard from './components/OverviewDashboard';
import DeviceManagement from './components/DeviceManagement';
import AIAgentPanel from './components/AIAgentPanel';
import AnalyticsCharts from './components/AnalyticsCharts';
import SystemStatusBar from './components/SystemStatusBar';
import SettingsModal from './components/SettingsModal';
import ScenarioSimulator, { SCENARIO_PRESETS } from './components/ScenarioSimulator';
import AdminLogin from './components/AdminLogin';
import api from './services/api';
import { AlertCircle, WifiOff, RefreshCw, Sparkles, X, Play, CheckCircle2, ShieldCheck, Terminal, Activity } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('scada_admin_auth') === 'true';
  });
  const [operatorId, setOperatorId] = useState(() => {
    return sessionStorage.getItem('scada_operator_id') || 'ADMIN';
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [powerHistory, setPowerHistory] = useState([2400, 2800, 3100, 3400, 3800]);
  const [esp32Online, setEsp32Online] = useState(false);
  const [lastTelemetryDate, setLastTelemetryDate] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOfflineDemoActive, setIsOfflineDemoActive] = useState(false);

  const prevTimestampRef = useRef(null);
  const offlineTimerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  const handleLoginSuccess = (user) => {
    setOperatorId(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('scada_admin_auth');
    localStorage.removeItem('scada_operator_id');
    sessionStorage.removeItem('scada_admin_auth');
    sessionStorage.removeItem('scada_operator_id');
    setIsAuthenticated(false);
  };

  // Initialize Initial Offline Mock Data Generator
  const createMockDashboard = (fanOn = true, ledOn = true, scenarioKey = 'NORMAL') => {
    const preset = SCENARIO_PRESETS[scenarioKey] || SCENARIO_PRESETS.NORMAL;
    const fanVolts = fanOn ? preset.fan.voltage : 0;
    const fanCurrent = fanOn ? preset.fan.current_ma : 0;
    const fanPower = fanOn ? preset.fan.power_mw : 0;

    const ledVolts = ledOn ? preset.led.voltage : 0;
    const ledCurrent = ledOn ? preset.led.current_ma : 0;
    const ledPower = ledOn ? preset.led.power_mw : 0;

    const totalPower = fanPower + ledPower;

    return {
      latest_reading: {
        fan: { voltage: fanVolts, current_ma: fanCurrent, power_mw: fanPower, relay_on: fanOn },
        led: { voltage: ledVolts, current_ma: ledCurrent, power_mw: ledPower, relay_on: ledOn },
        total_power_mw: totalPower,
        is_simulated: true,
        timestamp: new Date().toISOString()
      },
      devices: [
        { device_id: 'fan', name: '12V DC Brushless Fan', voltage_rating: '12V DC', relay_pin: 25, status: fanOn ? 'ON' : 'OFF', is_active: fanOn },
        { device_id: 'led', name: '12V DC LED Module', voltage_rating: '12V DC', relay_pin: 26, status: ledOn ? 'ON' : 'OFF', is_active: ledOn }
      ],
      system: {
        mode: 'MANUAL',
        esp32_connected: true,
        supabase_connected: false,
        timestamp: new Date().toISOString()
      },
      analytics: {
        total_energy_wh: 4.825,
        total_energy_kwh: 0.004825,
        peak_power_mw: 7850,
        avg_power_mw: 3620,
        fan_energy_wh: 2.85,
        led_energy_wh: 1.975
      },
      ai: {
        status: {
          status: 'ACTIVE',
          model_type: 'RandomForest',
          n_estimators: 100,
          accuracy: 0.965
        },
        latest_decision: {
          classification: !fanOn && !ledOn ? 'IDLE' : preset.classification,
          confidence: preset.confidence,
          suggested_action: preset.classification === 'ABNORMAL' ? 'EMERGENCY_STOP' : 'KEEP',
          action_taken: preset.classification === 'ABNORMAL' ? 'ISOLATION_RECOMMENDED' : 'MONITORED',
          reason: preset.reason,
          recommendation: preset.recommendation,
          timestamp: new Date().toISOString()
        },
        recent_decisions: [
          {
            id: 1,
            classification: 'NORMAL',
            confidence: 96.5,
            suggested_action: 'KEEP',
            action_taken: 'MONITORED',
            reason: 'Nominal telemetry observed across dual INA219 sensors.',
            recommendation: 'Maintain active state.',
            timestamp: new Date(Date.now() - 4000).toISOString()
          },
          {
            id: 2,
            classification: 'HIGH_CONSUMPTION',
            confidence: 94.2,
            suggested_action: 'THROTTLE',
            action_taken: 'NOTIFIED',
            reason: 'Combined branch load elevated.',
            recommendation: 'Monitor thermal limits.',
            timestamp: new Date(Date.now() - 30000).toISOString()
          }
        ]
      }
    };
  };

  // Fetch Dashboard & Telemetry Data from Real API
  const fetchData = async () => {
    if (isOfflineDemoActive || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [dash, hist] = await Promise.all([
        api.getDashboard(),
        api.getReadingHistory(30)
      ]);

      setDashboardData(dash);
      if (hist && hist.readings) {
        setHistoryData(hist.readings);
        const powers = hist.readings.map(r => r.total_power_mw || 0);
        if (powers.length > 0) setPowerHistory(powers);
      }
      consecutiveErrorsRef.current = 0;
      setBackendError(null);

      // Check ESP32 heartbeat freshness (generous 60s window for clock drift & network)
      const reading = dash?.latest_reading;
      if (reading && reading.timestamp) {
        const rawTs = String(reading.timestamp);
        const isoTs = rawTs.endsWith('Z') || rawTs.includes('+') ? rawTs : rawTs + 'Z';
        const readingTime = new Date(isoTs).getTime();
        const now = Date.now();
        if (reading.timestamp !== prevTimestampRef.current) {
          prevTimestampRef.current = reading.timestamp;
          setEsp32Online(true);
          setLastTelemetryDate(new Date(isoTs));
        } else if (Math.abs(now - readingTime) < 60000) {
          setEsp32Online(true);
        } else {
          setEsp32Online(false);
        }
      } else {
        setEsp32Online(false);
      }

    } catch (err) {
      console.warn('API Fetch Error:', err.message);
      consecutiveErrorsRef.current += 1;
      // Only display the error banner after 2 consecutive failed attempts to avoid jitter
      if (consecutiveErrorsRef.current >= 2) {
        setBackendError('Backend API is not responding. Ensure the backend server is running or launch Offline Demo mode.');
        setEsp32Online(false);
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Launch Offline Demo Mode
  const launchOfflineDemo = () => {
    setIsOfflineDemoActive(true);
    setBackendError(null);
    setEsp32Online(true);
    setLastTelemetryDate(new Date());

    const initial = createMockDashboard(true, true, 'NORMAL');
    setDashboardData(initial);

    // Initial seed history points
    const now = Date.now();
    const seeded = Array.from({ length: 15 }, (_, i) => {
      const t = new Date(now - (15 - i) * 3000).toISOString();
      const p = 3500 + Math.round(Math.random() * 600 - 300);
      return {
        timestamp: t,
        total_power_mw: p,
        fan: { voltage: 12.1, current_ma: 185, power_mw: 2240 },
        led: { voltage: 5.0, current_ma: 310, power_mw: 1550 }
      };
    });
    setHistoryData(seeded);
    setPowerHistory(seeded.map(s => s.total_power_mw));
  };

  // Exit Offline Demo Mode & Re-attempt backend
  const exitOfflineDemo = () => {
    setIsOfflineDemoActive(false);
    if (offlineTimerRef.current) clearInterval(offlineTimerRef.current);
    fetchData();
  };

  // Offline Simulation Ticker Loop
  useEffect(() => {
    if (!isOfflineDemoActive) return;

    offlineTimerRef.current = setInterval(() => {
      setDashboardData(prev => {
        if (!prev) return prev;
        const fanDev = prev.devices?.find(d => d.device_id === 'fan');
        const ledDev = prev.devices?.find(d => d.device_id === 'led');
        const fanOn = fanDev?.status === 'ON';
        const ledOn = ledDev?.status === 'ON';

        // Apply slight realistic sensor micro-jitter
        const fanJitter = (Math.random() * 0.04 - 0.02);
        const fanCurrentJitter = Math.round(Math.random() * 6 - 3);
        const ledJitter = (Math.random() * 0.02 - 0.01);
        const ledCurrentJitter = Math.round(Math.random() * 4 - 2);

        const fanVolts = fanOn ? +(12.12 + fanJitter).toFixed(2) : 0;
        const fanMa = fanOn ? Math.max(1, 185 + fanCurrentJitter) : 0;
        const fanMw = +(fanVolts * fanMa).toFixed(0);

        const ledVolts = ledOn ? +(5.02 + ledJitter).toFixed(2) : 0;
        const ledMa = ledOn ? Math.max(1, 312 + ledCurrentJitter) : 0;
        const ledMw = +(ledVolts * ledMa).toFixed(0);

        const totalMw = fanMw + ledMw;

        // Energy accumulation (+2 seconds of watt-hours)
        const addedWh = (totalMw / 1000) * (2 / 3600);
        const currentWh = (prev.analytics?.total_energy_wh || 4.825) + addedWh;
        const currentKwh = currentWh / 1000;

        const newReading = {
          fan: { voltage: fanVolts, current_ma: fanMa, power_mw: fanMw, relay_on: fanOn },
          led: { voltage: ledVolts, current_ma: ledMa, power_mw: ledMw, relay_on: ledOn },
          total_power_mw: totalMw,
          is_simulated: true,
          timestamp: new Date().toISOString()
        };

        // Append to history
        setHistoryData(hPrev => [...hPrev.slice(-25), newReading]);
        setPowerHistory(pPrev => [...pPrev.slice(-20), totalMw]);
        setLastTelemetryDate(new Date());

        return {
          ...prev,
          latest_reading: newReading,
          analytics: {
            ...prev.analytics,
            total_energy_wh: currentWh,
            total_energy_kwh: currentKwh,
            peak_power_mw: Math.max(prev.analytics?.peak_power_mw || 0, totalMw)
          }
        };
      });
    }, 2000);

    return () => {
      if (offlineTimerRef.current) clearInterval(offlineTimerRef.current);
    };
  }, [isOfflineDemoActive]);

  // Main Polling Loop (when backend online)
  useEffect(() => {
    if (!isOfflineDemoActive) {
      fetchData();
      const interval = setInterval(fetchData, 2500);
      return () => clearInterval(interval);
    }
  }, [isOfflineDemoActive]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (isOfflineDemoActive) {
      setTimeout(() => setIsRefreshing(false), 300);
    } else {
      await fetchData();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Toggle AUTO vs MANUAL Mode
  const handleToggleMode = async () => {
    const currentMode = dashboardData?.system?.mode || 'MANUAL';
    const nextMode = currentMode === 'AUTO' ? 'MANUAL' : 'AUTO';

    if (isOfflineDemoActive) {
      setDashboardData(prev => ({
        ...prev,
        system: { ...prev.system, mode: nextMode }
      }));
      return;
    }

    try {
      await api.setMode(nextMode);
      await fetchData();
    } catch (err) {
      alert(`Error updating mode: ${err.message}`);
    }
  };

  // Device Actuator Control
  const handleControlDevice = async (deviceId, action) => {
    if (isOfflineDemoActive) {
      setDashboardData(prev => {
        const nextDevices = (prev.devices || []).map(d =>
          d.device_id === deviceId
            ? { ...d, status: action, is_active: action === 'ON' }
            : d
        );
        const fanDev = nextDevices.find(d => d.device_id === 'fan');
        const ledDev = nextDevices.find(d => d.device_id === 'led');
        const fanOn = fanDev?.status === 'ON';
        const ledOn = ledDev?.status === 'ON';

        const fanMw = fanOn ? 2240 : 0;
        const ledMw = ledOn ? 1560 : 0;
        const total = fanMw + ledMw;

        return {
          ...prev,
          devices: nextDevices,
          latest_reading: {
            ...prev.latest_reading,
            fan: {
              ...prev.latest_reading.fan,
              relay_on: fanOn,
              voltage: fanOn ? 12.12 : 0,
              current_ma: fanOn ? 185 : 0,
              power_mw: fanMw
            },
            led: {
              ...prev.latest_reading.led,
              relay_on: ledOn,
              voltage: ledOn ? 5.02 : 0,
              current_ma: ledOn ? 312 : 0,
              power_mw: ledMw
            },
            total_power_mw: total
          }
        };
      });
      return;
    }

    try {
      await api.controlDevice(deviceId, action);
      await fetchData();
    } catch (err) {
      alert(`Control Error: ${err.message}`);
    }
  };

  // Emergency Stop Killswitch: turns all loads OFF
  const handleEmergencyStop = async () => {
    if (!window.confirm('EMERGENCY KILLSWITCH: Disconnect all physical loads immediately?')) {
      return;
    }

    if (isOfflineDemoActive) {
      setDashboardData(prev => ({
        ...prev,
        devices: (prev.devices || []).map(d => ({ ...d, status: 'OFF', is_active: false })),
        latest_reading: {
          fan: { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false },
          led: { voltage: 0, current_ma: 0, power_mw: 0, relay_on: false },
          total_power_mw: 0,
          is_simulated: true,
          timestamp: new Date().toISOString()
        },
        ai: {
          ...prev.ai,
          latest_decision: {
            classification: 'IDLE',
            confidence: 99.0,
            suggested_action: 'HOLD',
            action_taken: 'EMERGENCY_SHUTDOWN',
            reason: 'Manual emergency stop triggered by operator. Both relays isolated.',
            recommendation: 'Loads safe in de-energized state.',
            timestamp: new Date().toISOString()
          }
        }
      }));
      return;
    }

    try {
      await Promise.all([
        api.controlDevice('fan', 'OFF'),
        api.controlDevice('led', 'OFF')
      ]);
      await fetchData();
    } catch (err) {
      alert(`Emergency Stop Error: ${err.message}`);
    }
  };

  // Direct injection from Scenario Simulator
  const handleInjectTelemetry = (simulatedReading, simulatedDecision) => {
    setDashboardData(prev => {
      const fanOn = simulatedReading.fan.relay_on;
      const ledOn = simulatedReading.led.relay_on;
      const total = simulatedReading.total_power_mw;

      return {
        ...prev,
        latest_reading: simulatedReading,
        devices: [
          { device_id: 'fan', name: '12V DC Brushless Fan', voltage_rating: '12V DC', relay_pin: 25, status: fanOn ? 'ON' : 'OFF', is_active: fanOn },
          { device_id: 'led', name: '5V DC COB LED Module', voltage_rating: '5V DC', relay_pin: 26, status: ledOn ? 'ON' : 'OFF', is_active: ledOn }
        ],
        ai: {
          ...prev?.ai,
          latest_decision: simulatedDecision,
          recent_decisions: [
            { id: Date.now(), ...simulatedDecision },
            ...(prev?.ai?.recent_decisions || []).slice(0, 10)
          ]
        }
      };
    });

    setHistoryData(prev => [...prev.slice(-25), simulatedReading]);
    setPowerHistory(prev => [...prev.slice(-20), simulatedReading.total_power_mw]);
  };

  const mode = dashboardData?.system?.mode || 'MANUAL';

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* Top SCADA Navigation */}
      <div>
        <Navbar
          systemData={dashboardData}
          esp32Online={esp32Online}
          onToggleMode={handleToggleMode}
          onEmergencyStop={handleEmergencyStop}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isRefreshing={isRefreshing}
          onManualRefresh={handleManualRefresh}
          operatorId={operatorId}
          onLogout={handleLogout}
        />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">

          {/* Professional SCADA Station Metadata Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#0D1524]/90 border border-[#1E2E4A] text-[11px] sm:text-xs font-mono">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                <span>TERMINAL://OPT-STATION-01</span>
              </span>
              <span className="text-slate-600 hidden xs:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">
                LOADS: <span className="text-slate-200">12V FAN (0x40)</span> &amp; <span className="text-slate-200">12V LED (0x41)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-[11px]">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
                <span>CYCLE: 2.0s</span>
              </span>
              <span className="text-slate-600 hidden md:inline">|</span>
              <span className="text-slate-400 hidden md:inline">
                ENGINE: <span className="text-cyan-300">RANDOM FOREST OODA</span>
              </span>
            </div>
          </div>
          
          {/* Active Offline Demo Banner */}
          {isOfflineDemoActive && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono gap-3 shadow-glow-emerald">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>OFFLINE VIVA DEMONSTRATION ACTIVE:</strong> In-memory simulation running with dynamic telemetry, Random Forest OODA loop, and interactive device controls.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exitOfflineDemo}
                  className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-200 uppercase font-bold text-[10px]"
                >
                  Exit Demo & Reconnect Server
                </button>
              </div>
            </div>
          )}

          {/* Backend Connection Warning (with 1-Click Offline Demo Button) */}
          {backendError && !isErrorDismissed && !isOfflineDemoActive && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded bg-rose-950/50 border border-rose-500/60 text-rose-300 text-xs font-mono gap-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-100">Flask Backend Offline or Unreachable</span>
                  <span className="text-[11px] text-rose-300/90">{backendError}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
                <button
                  onClick={launchOfflineDemo}
                  className="px-3.5 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase text-[11px] flex items-center space-x-1.5 shadow-glow-cyan"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Offline Demo</span>
                </button>
                <button
                  onClick={handleManualRefresh}
                  className="px-2.5 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 uppercase font-bold text-[10px]"
                >
                  Retry
                </button>
                <button
                  onClick={() => setIsErrorDismissed(true)}
                  className="p-1 rounded text-rose-400 hover:text-white"
                  title="Dismiss warning"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Examiner & Viva Scenario Simulator */}
          <ScenarioSimulator
            onInjectTelemetry={handleInjectTelemetry}
            isOfflineMode={isOfflineDemoActive || Boolean(backendError)}
            onForceRefresh={fetchData}
          />

          {/* Section A: Live Overview Dashboard HUD with Radial Gauge & Carbon/Cost metrics */}
          <OverviewDashboard
            latestReading={dashboardData?.latest_reading}
            analytics={dashboardData?.analytics}
            systemData={dashboardData}
            powerHistory={powerHistory}
          />

          {/* Section B: Device Actuator Cards with Tactile RPM & Glow Animations */}
          <DeviceManagement
            devices={dashboardData?.devices}
            latestReading={dashboardData?.latest_reading}
            onControlDevice={handleControlDevice}
            operatingMode={mode}
          />

          {/* Section C: AI Agent Decision Center */}
          <AIAgentPanel
            aiStatus={dashboardData?.ai?.status}
            latestDecision={dashboardData?.ai?.latest_decision}
            recentDecisions={dashboardData?.ai?.recent_decisions}
            operatingMode={mode}
          />

          {/* Section D: Energy Analytics & Comparison Graph */}
          <AnalyticsCharts
            historyData={historyData}
            analytics={dashboardData?.analytics}
          />

        </main>
      </div>

      {/* Section F: Live System Status Bar */}
      <SystemStatusBar
        esp32Online={esp32Online}
        lastTelemetryTime={lastTelemetryDate}
        latestReading={dashboardData?.latest_reading}
        systemData={dashboardData}
        operatingMode={mode}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemData={dashboardData}
        operatingMode={mode}
        onToggleMode={handleToggleMode}
      />

    </div>
  );
}
