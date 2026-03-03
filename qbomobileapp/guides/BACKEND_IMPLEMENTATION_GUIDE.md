# QBO Robot Control Backend Implementation Guide

## Overview
This document provides detailed instructions on how to implement the QBO Robot API integration in your backend server to work with the mobile app.

## Architecture Overview

```
Mobile App (React Native)
    ↓ HTTP Requests
Backend Server (Node.js/Express)
    ↓ Serial/BLE Communication
QBO Robot Hardware
```

## Required Dependencies

### Node.js Backend (Express)

```bash
npm install express cors dotenv
npm install serialport  # For serial connection to QBO
# OR
npm install noble  # For Bluetooth Low Energy (BLE) communication
```

## File Structure

```
backend/
├── server.js
├── routes/
│   └── robot.js
├── controllers/
│   └── robotController.js
├── services/
│   └── qboRobotService.js
├── config/
│   └── robot-config.js
├── middleware/
│   └── errorHandler.js
└── .env
```

## Step 1: Create the Main Server File

**backend/server.js**

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const robotRoutes = require('./routes/robot');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/robot', robotRoutes);

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`QBO Robot Server running on http://localhost:${PORT}`);
});

module.exports = app;
```

## Step 2: Create Environment Configuration

**backend/.env**

```
PORT=3000
ROBOT_PORT=/dev/ttyUSB0  # Linux/Mac serial port or COM3 for Windows
ROBOT_BAUDRATE=9600
ROBOT_TYPE=qbo  # or bluetooth-ble
API_BASE_URL=http://localhost:3000/api
```

## Step 3: Create Robot Service (Core Communication Layer)

**backend/services/qboRobotService.js**

```javascript
const SerialPort = require('serialport');
const EventEmitter = require('events');

class QboRobotService extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.port = null;
    this.isConnected = false;
    this.robotState = {
      battery: 100,
      position: { x: 0, y: 0, angle: 0 },
      isMoving: false,
    };
  }

  // Connect to QBO Robot via Serial Port
  async connect() {
    try {
      this.port = new SerialPort.SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
      });

      return new Promise((resolve, reject) => {
        this.port.on('open', () => {
          console.log('Connected to QBO Robot');
          this.isConnected = true;
          this.startStatusMonitoring();
          resolve(true);
        });

        this.port.on('error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        this.port.on('data', (data) => {
          this.handleRobotData(data);
        });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  // Disconnect from Robot
  async disconnect() {
    if (this.port && this.isConnected) {
      this.port.close();
      this.isConnected = false;
      console.log('Disconnected from QBO Robot');
    }
  }

  // Send Raw Command to Robot
  sendRawCommand(command) {
    if (!this.isConnected) {
      throw new Error('Robot not connected');
    }

    return new Promise((resolve, reject) => {
      this.port.write(command, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Move Robot Forward/Backward
  async move(distance, speed = 50) {
    // Distance in cm, Speed 0-100
    const direction = distance > 0 ? 1 : -1;
    const cmd = `MOVE:${direction},${Math.abs(distance)},${speed}\n`;
    
    this.robotState.isMoving = true;
    this.emit('moving', true);
    
    await this.sendRawCommand(cmd);
    
    // Simulate movement completion (adjust based on actual robot response)
    setTimeout(() => {
      this.robotState.isMoving = false;
      this.emit('moving', false);
    }, (Math.abs(distance) / speed) * 1000);
  }

  // Turn Robot Left/Right
  async turn(angle, speed = 50) {
    // Angle in degrees, positive = right, negative = left
    const direction = angle > 0 ? 1 : -1;
    const cmd = `TURN:${direction},${Math.abs(angle)},${speed}\n`;
    
    this.robotState.isMoving = true;
    this.emit('moving', true);
    
    await this.sendRawCommand(cmd);
    
    setTimeout(() => {
      this.robotState.isMoving = false;
      this.robotState.position.angle += angle;
      this.emit('moving', false);
    }, (Math.abs(angle) / speed) * 1000);
  }

  // Stop Robot
  async stop() {
    const cmd = 'STOP\n';
    await this.sendRawCommand(cmd);
    this.robotState.isMoving = false;
    this.emit('moving', false);
  }

  // Dance Command
  async dance(danceType = 'default') {
    const danceMap = {
      default: 'DANCE:1',
      spin: 'DANCE:2',
      wave: 'DANCE:3',
    };
    
    const cmd = `${danceMap[danceType] || danceMap.default}\n`;
    await this.sendRawCommand(cmd);
  }

  // Set RGB Light
  async setLight(red, green, blue, duration = 1000) {
    const cmd = `LIGHT:${red},${green},${blue},${duration}\n`;
    await this.sendRawCommand(cmd);
  }

  // Play Sound
  async playSound(soundType, volume = 80) {
    const soundMap = {
      chirp: 'SOUND:1',
      beep: 'SOUND:2',
      laugh: 'SOUND:3',
      alarm: 'SOUND:4',
    };
    
    const cmd = `${soundMap[soundType] || soundMap.chirp},${volume}\n`;
    await this.sendRawCommand(cmd);
  }

  // Handle incoming data from robot
  handleRobotData(data) {
    const message = data.toString().trim();
    
    if (message.startsWith('BATTERY:')) {
      this.robotState.battery = parseInt(message.split(':')[1]);
      this.emit('battery', this.robotState.battery);
    } else if (message.startsWith('POS:')) {
      const parts = message.split(':')[1].split(',');
      this.robotState.position = {
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1]),
        angle: parseFloat(parts[2]),
      };
      this.emit('position', this.robotState.position);
    } else if (message === 'DONE') {
      this.robotState.isMoving = false;
      this.emit('moving', false);
    }
  }

  // Start periodic status monitoring
  startStatusMonitoring() {
    this.statusInterval = setInterval(async () => {
      try {
        await this.sendRawCommand('STATUS\n');
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 2000);
  }

  // Get current robot state
  getState() {
    return {
      isConnected: this.isConnected,
      ...this.robotState,
    };
  }
}

module.exports = QboRobotService;
```

## Step 4: Create Robot Controller

**backend/controllers/robotController.js**

```javascript
const QboRobotService = require('../services/qboRobotService');
const robotConfig = require('../config/robot-config');

let robotService = null;

const initRobotService = () => {
  if (!robotService) {
    robotService = new QboRobotService(robotConfig);
  }
  return robotService;
};

exports.connect = async (req, res) => {
  try {
    const service = initRobotService();
    await service.connect();
    res.json({
      success: true,
      message: 'Connected to QBO robot',
      state: service.getState(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.disconnect = async (req, res) => {
  try {
    const service = initRobotService();
    await service.disconnect();
    res.json({
      success: true,
      message: 'Disconnected from QBO robot',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStatus = (req, res) => {
  try {
    const service = initRobotService();
    const state = service.getState();
    res.json({
      success: true,
      ...state,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendCommand = async (req, res) => {
  try {
    const { type, parameters } = req.body;
    const service = initRobotService();

    if (!service.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Robot not connected',
      });
    }

    switch (type) {
      case 'move':
        await service.move(parameters.distance, parameters.speed);
        break;
      case 'turn':
        await service.turn(parameters.angle, parameters.speed);
        break;
      case 'stop':
        await service.stop();
        break;
      case 'dance':
        await service.dance(parameters.danceType);
        break;
      case 'light':
        await service.setLight(
          parameters.red,
          parameters.green,
          parameters.blue,
          parameters.duration
        );
        break;
      case 'sound':
        await service.playSound(parameters.soundType, parameters.volume);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown command type',
        });
    }

    res.json({
      success: true,
      message: 'Command sent',
      state: service.getState(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

## Step 5: Create Routes

**backend/routes/robot.js**

```javascript
const express = require('express');
const robotController = require('../controllers/robotController');

const router = express.Router();

// Connection endpoints
router.post('/connect', robotController.connect);
router.post('/disconnect', robotController.disconnect);

// Status endpoint
router.get('/status', robotController.getStatus);

// Command endpoint
router.post('/command', robotController.sendCommand);

module.exports = router;
```

## Step 6: Create Configuration File

**backend/config/robot-config.js**

```javascript
module.exports = {
  port: process.env.ROBOT_PORT || '/dev/ttyUSB0', // Serial port
  baudRate: parseInt(process.env.ROBOT_BAUDRATE || '9600'),
  type: process.env.ROBOT_TYPE || 'qbo',
  connectionTimeout: 5000,
  commandTimeout: 10000,
};
```

## Step 7: Create Error Handler Middleware

**backend/middleware/errorHandler.js**

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
```

## API Endpoints Reference

### 1. Connect to Robot
```
POST /api/robot/connect
Response:
{
  "success": true,
  "message": "Connected to QBO robot",
  "state": {
    "isConnected": true,
    "battery": 100,
    "position": { "x": 0, "y": 0, "angle": 0 },
    "isMoving": false
  }
}
```

### 2. Disconnect from Robot
```
POST /api/robot/disconnect
Response:
{
  "success": true,
  "message": "Disconnected from QBO robot"
}
```

### 3. Get Robot Status
```
GET /api/robot/status
Response:
{
  "success": true,
  "isConnected": true,
  "battery": 85,
  "position": { "x": 10, "y": 5, "angle": 45 },
  "isMoving": false
}
```

### 4. Send Command
```
POST /api/robot/command
Body: {
  "type": "move|turn|stop|dance|light|sound",
  "parameters": { ... }
}

Examples:
// Move forward 20cm at speed 100
{
  "type": "move",
  "parameters": { "distance": 20, "speed": 100 }
}

// Turn right 90 degrees
{
  "type": "turn",
  "parameters": { "angle": 90, "speed": 100 }
}

// Set light to blue
{
  "type": "light",
  "parameters": { "red": 0, "green": 0, "blue": 255, "duration": 1000 }
}
```

## Installation & Setup

### 1. Create Backend Project
```bash
mkdir qbo-robot-backend
cd qbo-robot-backend
npm init -y
npm install express cors dotenv serialport
```

### 2. Create File Structure
Follow the structure provided above

### 3. Update package.json
```json
{
  "name": "qbo-robot-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "serialport": "^11.0.0"
  }
}
```

### 4. Run the Server
```bash
npm install
npm start
# Server will run on http://localhost:3000
```

## Testing the Connection

### Using curl:
```bash
# Connect to robot
curl -X POST http://localhost:3000/api/robot/connect

# Get status
curl http://localhost:3000/api/robot/status

# Move forward
curl -X POST http://localhost:3000/api/robot/command \
  -H "Content-Type: application/json" \
  -d '{
    "type": "move",
    "parameters": { "distance": 20, "speed": 50 }
  }'
```

## QBO Robot Serial Protocol

### Command Format
```
COMMAND:param1,param2,param3\n
```

### Available Commands

| Command | Format | Example |
|---------|--------|---------|
| Move | MOVE:direction,distance,speed | MOVE:1,20,50 |
| Turn | TURN:direction,angle,speed | TURN:1,90,50 |
| Stop | STOP | STOP |
| Dance | DANCE:type | DANCE:1 |
| Light | LIGHT:r,g,b,duration | LIGHT:255,0,0,1000 |
| Sound | SOUND:type,volume | SOUND:1,80 |
| Status | STATUS | STATUS |

### Response Format
```
BATTERY:85
POS:10,5,45
DONE
```

## Troubleshooting

### Port Not Found
- Check serial port name: `ls /dev/tty*` (Mac/Linux) or `Get-SerialPort` (Windows)
- Update `.env` with correct port

### Connection Timeout
- Ensure QBO robot is powered on
- Check USB cable connection
- Verify correct baud rate

### Command Not Executing
- Check robot battery level
- Ensure robot is in ready state
- Verify command format matches protocol

## Next Steps

1. **Add WebSocket Support** for real-time communication
2. **Implement Authentication** for multi-user access
3. **Add Logging System** for debugging
4. **Create Admin Dashboard** for monitoring
5. **Add Queue System** for command buffering
6. **Implement Rate Limiting** for API protection
