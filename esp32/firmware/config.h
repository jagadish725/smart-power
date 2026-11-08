#ifndef CONFIG_H
#define CONFIG_H

// ==============================================================================
// SMART POWER OPTIMIZATION SYSTEM - ESP32 FIRMWARE CONFIGURATION
// ==============================================================================

// 1. Wi-Fi Hotspot Credentials (Configured)
#define WIFI_SSID     "Enter Password"
#define WIFI_PASSWORD "Enterpassword"

// 2. Flask Backend API Configuration
// Laptop's Wi-Fi IP address on your hotspot network
#define BACKEND_HOST "192.168.1.10"
#define BACKEND_PORT 5000
#define API_ENDPOINT "http://" BACKEND_HOST ":" String(BACKEND_PORT) "/api/readings"

// 3. I2C Pin Assignments for ESP32 DevKit V1
#define I2C_SDA_PIN  21
#define I2C_SCL_PIN  22

// 4. INA219 I2C Addresses
#define INA219_FAN_ADDR  0x40  // Sensor #1 (Default address)
#define INA219_LED_ADDR  0x41  // Sensor #2 (A0 bridged)

// 5. Relay GPIO Pin Assignments
#define RELAY_FAN_PIN  25      // Relay Channel 1: 12V Fan
#define RELAY_LED_PIN  26      // Relay Channel 2: 5V COB LED

// 6. Relay Logic Configuration
// Standard 5V optocoupled relay modules are ACTIVE-LOW (LOW = ON, HIGH = OFF)
#define RELAY_ACTIVE_LOW  true

// 7. Telemetry Reporting Interval (in milliseconds)
#define TELEMETRY_INTERVAL_MS 2000

#endif // CONFIG_H
