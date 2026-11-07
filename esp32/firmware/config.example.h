#ifndef CONFIG_H
#define CONFIG_H

// ==============================================================================
// SMART POWER OPTIMIZATION SYSTEM - ESP32 FIRMWARE CONFIGURATION
// ==============================================================================
// Copy this file to 'config.h' and fill in your local Wi-Fi and laptop IP settings.
// ==============================================================================

// 1. Wi-Fi Credentials
// Connect your ESP32 to the SAME Wi-Fi network as your laptop/computer.
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. Flask Backend API Configuration
// Replace with your laptop's local IPv4 address (e.g., "192.168.1.15").
// To find your IP on Windows: Open CMD and type: ipconfig (Look for IPv4 Address).
// On Mac/Linux: run: ifconfig or ip a.
// Do NOT use "localhost" or "127.0.0.1" because ESP32 is a separate physical device!
#define BACKEND_HOST "192.168.1.100"
#define BACKEND_PORT 5000
#define API_ENDPOINT "http://" BACKEND_HOST ":" String(BACKEND_PORT) "/api/readings"

// 3. I2C Pin Assignments for ESP32 DevKit V1
#define I2C_SDA_PIN  21
#define I2C_SCL_PIN  22

// 4. INA219 I2C Addresses
#define INA219_FAN_ADDR  0x40  // Default address (A0, A1 bridged to GND / unsoldered)
#define INA219_LED_ADDR  0x41  // A0 solder bridge closed to VCC/GND per breakout PCB

// 5. Relay GPIO Pin Assignments
#define RELAY_FAN_PIN  25      // Relay Channel 1: 12V Fan
#define RELAY_LED_PIN  26      // Relay Channel 2: 5V COB LED

// 6. Relay Logic Configuration
// Standard 5V optocoupled relay modules are ACTIVE-LOW (LOW turns relay ON, HIGH turns it OFF).
// If your relay is active-HIGH, change this to false.
#define RELAY_ACTIVE_LOW  true

// 7. Telemetry Reporting Interval (in milliseconds)
#define TELEMETRY_INTERVAL_MS 2000

#endif // CONFIG_H

