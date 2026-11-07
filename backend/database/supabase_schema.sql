-- ============================================================================
-- SMART POWER OPTIMIZATION SYSTEM USING AI AGENTS
-- Supabase Database Schema
-- Paste this script into your Supabase project's SQL Editor and click 'Run'.
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sensor Readings Table (Stores real-time telemetry from ESP32)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    fan_voltage NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    fan_current_ma NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    fan_power_mw NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    led_voltage NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    led_current_ma NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    led_power_mw NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_power_mw NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    fan_relay_state BOOLEAN NOT NULL DEFAULT FALSE,
    led_relay_state BOOLEAN NOT NULL DEFAULT FALSE,
    is_simulated BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings(created_at DESC);

-- 2. Devices State Table
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    voltage_rating VARCHAR(20) NOT NULL,
    relay_pin INTEGER NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'OFF',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial device states
INSERT INTO devices (device_id, name, voltage_rating, relay_pin, status, is_active)
VALUES 
    ('fan', '12V DC Brushless Fan', '12V DC', 25, 'OFF', FALSE),
    ('led', '5V DC COB LED Module', '5V DC', 26, 'OFF', FALSE)
ON CONFLICT (device_id) DO NOTHING;

-- 3. AI Decisions & Recommendations Log Table
CREATE TABLE IF NOT EXISTS ai_decisions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    classification VARCHAR(50) NOT NULL,     -- NORMAL, IDLE, HIGH_CONSUMPTION, ABNORMAL
    confidence NUMERIC(5, 2) NOT NULL,       -- Percentage (e.g. 94.50)
    recommendation TEXT NOT NULL,
    reason TEXT NOT NULL,
    suggested_action VARCHAR(50) NOT NULL,   -- KEEP, OPTIMIZE_FAN, SHUTDOWN_LED, ALERT
    action_taken VARCHAR(50) NOT NULL DEFAULT 'MONITORED',
    power_observed_mw NUMERIC(10, 2) NOT NULL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at DESC);

-- 4. System Settings & Configuration Table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default operating modes and thresholds
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
    ('operating_mode', 'MANUAL', 'Operating mode: AUTO or MANUAL'),
    ('fan_power_threshold_mw', '6000', 'Threshold for fan high consumption warning (mW)'),
    ('led_power_threshold_mw', '3500', 'Threshold for LED high consumption warning (mW)'),
    ('total_power_budget_mw', '8500', 'Overall safety power budget (mW)')
ON CONFLICT (setting_key) DO NOTHING;

