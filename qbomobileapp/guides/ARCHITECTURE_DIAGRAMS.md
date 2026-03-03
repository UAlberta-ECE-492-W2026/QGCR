# QBO Robot Control App - Architecture & Visual Guides

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         QBO ROBOT SYSTEM                        │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    MOBILE APPLICATION (React Native)             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Main Control Screen                    │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Status Display: Connected │ Battery: 85%          │  │   │
│  │  │ Position: X:10 Y:5 Angle:45°                      │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │              Movement Control Pad                  │  │   │
│  │  │                    [↑]                             │  │   │
│  │  │               [←] [●] [→]                          │  │   │
│  │  │                    [↓]                             │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │       Quick Actions: [Dance] [Sound]              │  │   │
│  │  │       [Red] [Blue] [Green] [Off]                  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  useQboRobot Hook (Central State Management)                    │
│  ├─ status: {isConnected, battery, position, error}            │
│  ├─ connect()          - Establish connection                  │
│  ├─ disconnect()       - Close connection                      │
│  ├─ move()            - Forward/backward                       │
│  ├─ turn()            - Left/right rotation                    │
│  ├─ stop()            - Stop movement                          │
│  ├─ dance()           - Play animation                         │
│  ├─ setLight()        - Control RGB LED                        │
│  └─ playSound()       - Play audio                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER (Express)                    │
│                                                                   │
│  REST Endpoints:                                                 │
│  ├─ POST   /api/robot/connect          ← Establish connection   │
│  ├─ POST   /api/robot/disconnect       ← Close connection       │
│  ├─ GET    /api/robot/status           ← Fetch robot state     │
│  ├─ POST   /api/robot/command          ← Send commands         │
│  └─ GET    /api/health                 ← Health check          │
│                                                                   │
│  Services:                                                       │
│  └─ QboRobotService                                             │
│     ├─ connect()         → SerialPort.open()                    │
│     ├─ sendRawCommand()  → port.write(command)                 │
│     ├─ handleRobotData() ← port.on('data')                     │
│     └─ getState()        → Current robot state                  │
│                                                                   │
│  Event Listeners:                                                │
│  ├─ 'moving'     - Movement started/stopped                     │
│  ├─ 'battery'    - Battery level changed                        │
│  ├─ 'position'   - Position/angle updated                       │
│  └─ 'error'      - Error occurred                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓ Serial
┌──────────────────────────────────────────────────────────────────┐
│                      QBO ROBOT HARDWARE                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Controllers:                                            │   │
│  │  ├─ Motor Control (Movement)                            │   │
│  │  ├─ LED Control (RGB Light)                             │   │
│  │  ├─ Audio Control (Sounds)                              │   │
│  │  ├─ Animation Engine (Dances)                           │   │
│  │  └─ Sensor Inputs (Battery, Position)                   │   │
│  │                                                          │   │
│  │  Sensors:                                               │   │
│  │  ├─ Battery Level Sensor                                │   │
│  │  ├─ Position Encoders                                   │   │
│  │  ├─ Gyroscope/Accelerometer                             │   │
│  │  └─ Microphone                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Connection Flow

```
USER ACTION: Click "Connect"
        ↓
   Frontend:
   robot.connect()
        ↓
   HTTP: POST /api/robot/connect
        ↓
   Backend:
   - Check serial port available
   - Open SerialPort connection
   - Initialize robot state
        ↓
   Hardware:
   - QBO robot receives connection signal
   - Initializes sensors
   - Sends status response
        ↓
   Backend:
   - Parse response
   - Set isConnected = true
   - Return connection status
        ↓
   HTTP Response: { success: true, state: {...} }
        ↓
   Frontend:
   - Update robot.status.isConnected = true
   - Start status polling
   - Enable control buttons
   - Show "Connected" message
```

### 2. Command Execution Flow

```
USER ACTION: Tap "Forward" button
        ↓
   Frontend Handler:
   handleMove('forward')
        ↓
   Call Hook:
   robot.move(distance=20, speed=100)
        ↓
   Hook Creates Command:
   {
     type: "move",
     parameters: { distance: 20, speed: 100 }
   }
        ↓
   HTTP: POST /api/robot/command
        ↓
   Backend Controller:
   - Validate command
   - Check robot connected
   - Create serial command
        ↓
   Serial Command Sent:
   "MOVE:1,20,100\n"
        ↓
   Hardware Processes:
   - Start motors
   - Move forward 20cm
   - Monitor movement
        ↓
   Hardware Sends Response:
   "DONE"
        ↓
   Backend:
   - Parse "DONE"
   - Update robot state
   - Return success response
        ↓
   HTTP Response:
   { success: true, state: {position: {x: 20, ...}} }
        ↓
   Frontend:
   - Update lastCommand
   - Show command in status
```

### 3. Status Polling Flow

```
After Connection Established...
        ↓
Every 2 Seconds (Configurable):
        ↓
   useEffect Hook Triggers:
   if (isConnected) {
     fetch('/api/robot/status')
   }
        ↓
   HTTP: GET /api/robot/status
        ↓
   Backend:
   - Read current robot state
   - Compile status object
        ↓
   HTTP Response:
   {
     isConnected: true,
     battery: 82,
     position: { x: 20, y: 5, angle: 45 },
     isMoving: false
   }
        ↓
   Frontend:
   - Update robot.status
   - Re-render status display
   - Update battery bar
   - Update position display
        ↓
   UI Updates:
   ├─ Battery: 82%
   ├─ Position: X:20 Y:5
   ├─ Angle: 45°
   └─ Status: Connected
```

## Component Hierarchy

```
App
├── (tabs) Layout
│   └── Tabs Navigation
│       ├── Home Tab
│       │   └── HomeScreen [index.tsx]
│       │       ├── ParallaxScrollView
│       │       ├── RobotStatusDisplay
│       │       │   ├── Status Indicator
│       │       │   ├── Battery Bar
│       │       │   └── Position Display
│       │       ├── Connection Controls
│       │       │   ├── Connect Button
│       │       │   └── Disconnect Button
│       │       ├── Movement Controls
│       │       │   └── ControlPad
│       │       │       ├── Up Button
│       │       │       ├── Left Button
│       │       │       ├── Center/Stop Button
│       │       │       ├── Right Button
│       │       │       └── Down Button
│       │       └── Quick Actions
│       │           └── QuickActionsGrid
│       │               ├── Dance Button
│       │               ├── Sound Button
│       │               ├── Red Light Button
│       │               ├── Blue Light Button
│       │               ├── Green Light Button
│       │               └── Off Button
│       │
│       └── Settings Tab
│           └── SettingsScreen [explore.tsx]
│               └── Configure robot defaults (speed, lights, sound)
│
├── Modal Screen [modal.tsx]
│
└── Styles/Theming
    ├── ThemedText
    ├── ThemedView
    └── Theme Constants
```

## API Command Types & Parameters

```
┌─────────────────────────────────────────────────┐
│         COMMAND TYPES AND STRUCTURE              │
├─────────────────────────────────────────────────┤

1. MOVE
   {
     "type": "move",
     "parameters": {
       "distance": 20,    // cm (-100 to 100)
       "speed": 100       // 0-100
     }
   }
   Serial: MOVE:1,20,100

2. TURN
   {
     "type": "turn",
     "parameters": {
       "angle": 90,       // degrees (-360 to 360)
       "speed": 100       // 0-100
     }
   }
   Serial: TURN:1,90,100

3. STOP
   {
     "type": "stop",
     "parameters": {}
   }
   Serial: STOP

4. LIGHT
   {
     "type": "light",
     "parameters": {
       "red": 255,        // 0-255
       "green": 0,        // 0-255
       "blue": 0,         // 0-255
       "duration": 1000   // milliseconds
     }
   }
   Serial: LIGHT:255,0,0,1000

5. SOUND
   {
     "type": "sound",
     "parameters": {
       "soundType": "chirp",  // chirp|beep|laugh|alarm
       "volume": 80           // 0-100
     }
   }
   Serial: SOUND:1,80

6. DANCE
   {
     "type": "dance",
     "parameters": {
       "danceType": "default" // default|spin|wave
     }
   }
   Serial: DANCE:1

└─────────────────────────────────────────────────┘
```

## Robot State Management

```
┌─────────────────────────────────────────┐
│       Robot State Object                │
├─────────────────────────────────────────┤
│                                         │
│  {                                      │
│    isConnected: boolean                 │
│    ├─ true  → Connected to robot        │
│    └─ false → No connection             │
│                                         │
│    batteryLevel: number (0-100)         │
│    ├─ > 60%  → Green (good)             │
│    ├─ 30-60% → Yellow (low)             │
│    └─ < 30%  → Red (critical)           │
│                                         │
│    position: {                          │
│      x: number,      // cm              │
│      y: number,      // cm              │
│      angle: number   // degrees (0-360) │
│    }                                    │
│                                         │
│    isMoving: boolean                    │
│    ├─ true  → Robot moving              │
│    └─ false → Robot stationary          │
│                                         │
│    lastCommand: string                  │
│    └─ Last executed command text        │
│                                         │
│    error: string | null                 │
│    └─ null = no error, string = error   │
│                                         │
│  }                                      │
│                                         │
└─────────────────────────────────────────┘

Updates every 2 seconds via polling
or on command execution
```

## Environment Configuration

```
┌─────────────────────────────────────────┐
│      Frontend .env Configuration        │
├─────────────────────────────────────────┤
│                                         │
│ EXPO_PUBLIC_API_URL=                    │
│   http://localhost:3000/api             │
│   (Local development)                   │
│                                         │
│   http://10.0.2.2:3000/api              │
│   (Android Emulator)                    │
│                                         │
│   http://192.168.1.100:3000/api         │
│   (Physical device - adjust IP)         │
│                                         │
│   https://api.yourserver.com            │
│   (Production)                          │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Backend .env Configuration         │
├─────────────────────────────────────────┤
│                                         │
│ PORT=3000                               │
│   API server port                       │
│                                         │
│ ROBOT_PORT=/dev/ttyUSB0                 │
│   Serial port path                      │
│   macOS/Linux: /dev/ttyUSB0             │
│   Windows: COM3                         │
│                                         │
│ ROBOT_BAUDRATE=9600                     │
│   Serial baud rate (usually 9600)       │
│                                         │
│ ROBOT_TYPE=qbo                          │
│   Robot model type                      │
│                                         │
│ NODE_ENV=development                    │
│   development|production                │
│                                         │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
Error Occurs
    ↓
Frontend or Backend?
    ├─ Frontend Error
    │  ├─ Network Error (no connection)
    │  │  └─ Show: "Cannot connect to backend"
    │  ├─ Parse Error (bad response)
    │  │  └─ Show: "Invalid response from server"
    │  └─ Status Error (operation failed)
    │     └─ Show: error.message from backend
    │
    └─ Backend Error
       ├─ Serial Port Error
       │  └─ Return: { success: false, message: "Serial port error" }
       ├─ Command Error
       │  └─ Return: { success: false, message: "Invalid command" }
       └─ Robot Error
          └─ Return: { success: false, message: "Robot not responding" }
    ↓
Error Object in robot.status.error
    ↓
UI Renders Error Container
    ├─ Red background
    ├─ Error message text
    └─ Usually clears on next successful command
```

## Performance Metrics

```
┌──────────────────────────────────────┐
│     Performance Considerations        │
├──────────────────────────────────────┤
│                                      │
│ Polling Frequency:                   │
│ ├─ Current: Every 2000ms (2 sec)    │
│ ├─ Can be: 1000ms to 5000ms         │
│ └─ Trade-off: Responsiveness vs CPU  │
│                                      │
│ Command Delay:                       │
│ ├─ Network latency: ~50-200ms        │
│ ├─ Robot processing: ~50-500ms       │
│ └─ Total: ~100-700ms per command     │
│                                      │
│ Battery Usage:                       │
│ ├─ Polling: ~1-2% per hour          │
│ ├─ Commands: Variable per action     │
│ └─ Motor: Depends on usage           │
│                                      │
│ Data Per Poll:                       │
│ ├─ Request: ~100 bytes               │
│ ├─ Response: ~200 bytes              │
│ └─ Total: ~300 bytes every 2 sec     │
│                                      │
└──────────────────────────────────────┘
```

## Deployment Architecture

```
┌───────────────────────────────────────────────┐
│          PRODUCTION DEPLOYMENT                │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │   Mobile Apps                         │   │
│  │   • iOS App Store                     │   │
│  │   • Google Play Store                 │   │
│  │   • Web: Vercel/Netlify               │   │
│  └──────────────────────────────────────┘   │
│                HTTPS                         │
│                  ↓                           │
│  ┌──────────────────────────────────────┐   │
│  │  Backend API (Cloud Hosting)         │   │
│  │  • Heroku, AWS, DigitalOcean, etc    │   │
│  │  • Domain: api.yourserver.com        │   │
│  │  • SSL Certificate enabled           │   │
│  │  • Load balancer if needed           │   │
│  └──────────────────────────────────────┘   │
│                Serial/USB                    │
│                  ↓                           │
│  ┌──────────────────────────────────────┐   │
│  │  QBO Robot (Local Network)           │   │
│  │  • Connected to server machine       │   │
│  │  • Or via gateway/hub                │   │
│  └──────────────────────────────────────┘   │
│                                               │
└───────────────────────────────────────────────┘
```

---

This document provides visual references for understanding the complete system architecture and data flows.
