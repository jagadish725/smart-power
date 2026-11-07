/*
 * ==============================================================================
 * PROJECT: SMART POWER OPTIMIZATION SYSTEM USING AI AGENTS
 * ESP32 DevKit V1 Firmware
 * ==============================================================================
 * Authors: Final Year Engineering Student & Senior Mentor
 * Description:
 *  - Reads 2x INA219 I2C Current/Voltage sensors:
 *      * Sensor 1 (0x40): 12V DC Brushless Fan
 *      * Sensor 2 (0x41): 5V DC COB LED Module (via LM2596 buck converter)
 *  - Controls 2x Relays on 2-channel 5V relay module:
 *      * Channel 1 (GPIO 25): 12V Fan
 *      * Channel 2 (GPIO 26): 5V COB LED
 *  - Connects to Wi-Fi and streams live sensor telemetry via HTTP POST to Flask API
 *  - Parses AI / backend relay control directives from JSON response
 *  - Safe bootup policy: Relays start OFF to prevent accidental energisation
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include "config.h"

// ------------------------------------------------------------------------------
// Sensor Objects (Adafruit INA219)
// ------------------------------------------------------------------------------
Adafruit_INA219 ina_fan(INA219_FAN_ADDR);
Adafruit_INA219 ina_led(INA219_LED_ADDR);

bool fanSensorOnline = false;
bool ledSensorOnline = false;

// ------------------------------------------------------------------------------
// Device & Relay State Tracking
// ------------------------------------------------------------------------------
bool fanRelayState = false;  // false = OFF, true = ON
bool ledRelayState = false;  // false = OFF, true = ON

unsigned long lastTelemetryTime = 0;

// Helper to write safe logic levels to relays
void setRelay(int pin, bool turnOn) {
  // If active-LOW: LOW turns relay ON, HIGH turns relay OFF
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, turnOn ? LOW : HIGH);
  } else {
    digitalWrite(pin, turnOn ? HIGH : LOW);
  }
}

// ------------------------------------------------------------------------------
// Wi-Fi Connection Management
// ------------------------------------------------------------------------------
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("\n[Wi-Fi] Connecting to network: " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection failed. Will retry during loop.");
  }
}

// ------------------------------------------------------------------------------
// Setup Routine
// ------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println(" SMART POWER OPTIMIZATION SYSTEM - ESP32 CONTROLLER ");
  Serial.println("=======================================================");

  // 1. SAFE RELAY INITIALIZATION:
  // Set relay pins to de-energised level BEFORE setting pinMode to OUTPUT
  // This prevents brief relay clicking/fluttering during ESP32 boot
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_FAN_PIN, HIGH);
    digitalWrite(RELAY_LED_PIN, HIGH);
  } else {
    digitalWrite(RELAY_FAN_PIN, LOW);
    digitalWrite(RELAY_LED_PIN, LOW);
  }
  pinMode(RELAY_FAN_PIN, OUTPUT);
  pinMode(RELAY_LED_PIN, OUTPUT);
  fanRelayState = false;
  ledRelayState = false;
  Serial.println("[Relays] Initialized in SAFE (OFF) state.");

  // 2. Initialize I2C Bus on GPIO 21 (SDA) and GPIO 22 (SCL)
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Serial.printf("[I2C] Bus initialized on SDA: GPIO %d, SCL: GPIO %d\n", I2C_SDA_PIN, I2C_SCL_PIN);

  // 3. Initialize INA219 #1 (Fan @ 0x40)
  if (ina_fan.begin()) {
    fanSensorOnline = true;
    Serial.printf("[Sensor 1] Fan INA219 online at I2C address 0x%02X.\n", INA219_FAN_ADDR);
  } else {
    fanSensorOnline = false;
    Serial.printf("[Sensor 1] WARNING: Fan INA219 not detected at 0x%02X.\n", INA219_FAN_ADDR);
  }

  // 4. Initialize INA219 #2 (LED @ 0x41)
  if (ina_led.begin()) {
    ledSensorOnline = true;
    Serial.printf("[Sensor 2] LED INA219 online at I2C address 0x%02X.\n", INA219_LED_ADDR);
  } else {
    ledSensorOnline = false;
    Serial.printf("[Sensor 2] WARNING: LED INA219 not detected at 0x%02X.\n", INA219_LED_ADDR);
  }

  // 5. Connect to Wi-Fi
  connectToWiFi();
}

// ------------------------------------------------------------------------------
// Simple JSON Extraction Helpers (Lightweight without external JSON library)
// ------------------------------------------------------------------------------
bool parseBooleanKey(const String &json, const String &key, bool defaultValue) {
  int keyIndex = json.indexOf("\"" + key + "\"");
  if (keyIndex == -1) return defaultValue;

  int colonIndex = json.indexOf(':', keyIndex);
  if (colonIndex == -1) return defaultValue;

  int trueIndex = json.indexOf("true", colonIndex);
  int falseIndex = json.indexOf("false", colonIndex);

  if (trueIndex != -1 && (falseIndex == -1 || trueIndex < falseIndex)) {
    return true;
  }
  if (falseIndex != -1 && (trueIndex == -1 || falseIndex < trueIndex)) {
    return false;
  }
  return defaultValue;
}

// ------------------------------------------------------------------------------
// Send Telemetry and Receive Backend Directives
// ------------------------------------------------------------------------------
void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  // Read Fan Sensor
  float fan_v = 0.0;
  float fan_i = 0.0;
  float fan_p = 0.0;
  if (fanSensorOnline) {
    fan_v = ina_fan.getBusVoltage_V();
    fan_i = ina_fan.getCurrent_mA();
    fan_p = ina_fan.getPower_mW();
    if (fan_i < 0.0) fan_i = 0.0;
    if (fan_p < 0.0) fan_p = 0.0;
  }

  // Read LED Sensor
  float led_v = 0.0;
  float led_i = 0.0;
  float led_p = 0.0;
  if (ledSensorOnline) {
    led_v = ina_led.getBusVoltage_V();
    led_i = ina_led.getCurrent_mA();
    led_p = ina_led.getPower_mW();
    if (led_i < 0.0) led_i = 0.0;
    if (led_p < 0.0) led_p = 0.0;
  }

  // Construct JSON Payload
  String payload = "{";
  payload += "\"fan\":{";
  payload += "\"voltage\":" + String(fan_v, 2) + ",";
  payload += "\"current_ma\":" + String(fan_i, 2) + ",";
  payload += "\"power_mw\":" + String(fan_p, 2) + ",";
  payload += "\"relay_on\":" + String(fanRelayState ? "true" : "false");
  payload += "},";
  payload += "\"led\":{";
  payload += "\"voltage\":" + String(led_v, 2) + ",";
  payload += "\"current_ma\":" + String(led_i, 2) + ",";
  payload += "\"power_mw\":" + String(led_p, 2) + ",";
  payload += "\"relay_on\":" + String(ledRelayState ? "true" : "false");
  payload += "},";
  payload += "\"is_simulated\":false";
  payload += "}";

  // HTTP POST to Flask Backend
  HTTPClient http;
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);

  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    String response = http.getString();
    Serial.println("[HTTP 200] Telemetry delivered. Server response: " + response);

    // Parse commands for fan and led relays
    bool targetFanRelay = parseBooleanKey(response, "fan_relay", fanRelayState);
    bool targetLedRelay = parseBooleanKey(response, "led_relay", ledRelayState);

    // Apply relay state updates if changed
    if (targetFanRelay != fanRelayState) {
      fanRelayState = targetFanRelay;
      setRelay(RELAY_FAN_PIN, fanRelayState);
      Serial.printf("[Relay 1] Fan Relay switched %s\n", fanRelayState ? "ON" : "OFF");
    }

    if (targetLedRelay != ledRelayState) {
      ledRelayState = targetLedRelay;
      setRelay(RELAY_LED_PIN, ledRelayState);
      Serial.printf("[Relay 2] LED Relay switched %s\n", ledRelayState ? "ON" : "OFF");
    }

  } else {
    Serial.printf("[HTTP ERROR] Failed to send telemetry. HTTP status code: %d\n", httpCode);
  }

  http.end();
}

// ------------------------------------------------------------------------------
// Main Execution Loop
// ------------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // Periodically send sensor telemetry
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;
    sendTelemetry();
  }

  // Auto-reconnect Wi-Fi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  delay(20);
}

