import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import OverviewDashboard from './components/OverviewDashboard';
import DeviceManagement from './components/DeviceManagement';
import AIAgentPanel from './components/AIAgentPanel';
import AnalyticsCharts from './components/AnalyticsCharts';
import SystemStatusBar from './components/SystemStatusBar';
import SettingsModal from './components/SettingsModal';
import api from './services/api';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [esp32Online, setEsp32Online] = useState(false);
  const [lastTelemetryDate, setLastTelemetryDate] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const prevTimestampRef = useRef(null);

  // Fetch Dashboard & Telemetry Data
  const fetchData = async () => {
    try {
      const [dash, hist] = await Promise.all([
        api.getDashboard(),
        api.getReadingHistory(30)
      ]);

      setDashboardData(dash);
      if (hist && hist.readings) {
        setHistoryData(hist.readings);
      }
      setBackendError(null);

      // Check ESP32 heartbeat freshness
      const reading = dash?.latest_reading;
      if (reading && reading.timestamp) {
        const readingTime = new Date(reading.timestamp).getTime();
        const now = Date.now();
        // If a reading arrived within the last 10 seconds or changed, ESP32/simulator is actively connected
        if (reading.timestamp !== prevTimestampRef.current) {
          prevTimestampRef.current = reading.timestamp;
          setEsp32Online(true);
          setLastTelemetryDate(new Date(reading.timestamp));
        } else if (now - readingTime < 10000) {
          setEsp32Online(true);
        } else {
          setEsp32Online(false);
        }
      } else {
        setEsp32Online(false);
      }

    } catch (err) {
      console.error('API Fetch Error:', err);
      setBackendError('Failed to communicate with Flask backend API at http://localhost:5000. Ensure app.py is running.');
      setEsp32Online(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // 2-second polling
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Toggle AUTO vs MANUAL Mode
  const handleToggleMode = async () => {
    const currentMode = dashboardData?.system?.mode || 'MANUAL';
    const nextMode = currentMode === 'AUTO' ? 'MANUAL' : 'AUTO';
    try {
      await api.setMode(nextMode);
      await fetchData();
    } catch (err) {
      alert(`Error updating mode: ${err.message}`);
    }
  };

  // Device Actuator Control
  const handleControlDevice = async (deviceId, action) => {
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

  const mode = dashboardData?.system?.mode || 'MANUAL';

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
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Backend Connection Error Warning */}
          {backendError && (
            <div className="flex items-center justify-between p-4 rounded bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{backendError}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 uppercase font-bold text-[10px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Section A: Live Overview Dashboard HUD */}
          <OverviewDashboard
            latestReading={dashboardData?.latest_reading}
            analytics={dashboardData?.analytics}
            systemData={dashboardData}
          />

          {/* Section B: Device Actuator Cards */}
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

