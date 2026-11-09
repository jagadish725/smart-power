import axios from 'axios';

// When deployed on Vercel, requests use relative '/api' on the same domain.
// In local development, vite.config.js proxies '/api' to 'http://localhost:5000/api'.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // System Health
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Comprehensive Dashboard
  getDashboard: async () => {
    const res = await client.get('/dashboard');
    return res.data;
  },

  // Telemetry Readings
  getLatestReading: async () => {
    const res = await client.get('/readings/latest');
    return res.data;
  },

  postReading: async (payload) => {
    const res = await client.post('/readings', payload);
    return res.data;
  },

  getReadingHistory: async (limit = 40) => {
    const res = await client.get(`/readings/history?limit=${limit}`);
    return res.data;
  },

  // Device Management
  getDevices: async () => {
    const res = await client.get('/devices');
    return res.data;
  },

  getDeviceStatus: async () => {
    const res = await client.get('/devices/status');
    return res.data;
  },

  controlDevice: async (deviceId, action) => {
    const res = await client.post('/devices/control', {
      device_id: deviceId,
      action: action,
    });
    return res.data;
  },

  // Operating Mode
  getMode: async () => {
    const res = await client.get('/mode');
    return res.data;
  },

  setMode: async (mode) => {
    const res = await client.post('/mode', { mode });
    return res.data;
  },

  // AI Agent
  getAIStatus: async () => {
    const res = await client.get('/ai/status');
    return res.data;
  },

  analyzeTelemetry: async (readingData = null) => {
    const res = await client.post('/ai/analyze', readingData || {});
    return res.data;
  },

  getAIDecisions: async (limit = 15) => {
    const res = await client.get(`/ai/decisions?limit=${limit}`);
    return res.data;
  },

  // Analytics
  getAnalyticsSummary: async () => {
    const res = await client.get('/analytics/summary');
    return res.data;
  },
};

export default api;

