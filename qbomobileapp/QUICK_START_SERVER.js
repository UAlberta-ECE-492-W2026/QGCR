// QBO ROBOT BACKEND - QUICK START SERVER
// This is a minimal working example to get started quickly
// For production, see BACKEND_IMPLEMENTATION_GUIDE.md for full implementation

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory robot state (replace with actual serial/BLE communication)
let robotState = {
  isConnected: false,
  battery: 100,
  position: { x: 0, y: 0, angle: 0 },
  isMoving: false,
  lastCommand: 'None',
};

// CONNECT ENDPOINT
app.post('/api/robot/connect', (req, res) => {
  try {
    // TODO: Implement actual serial port connection
    // For now, simulating connection
    
    robotState.isConnected = true;
    robotState.lastCommand = 'Connected';
    
    res.json({
      success: true,
      message: 'Connected to QBO robot',
      state: robotState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DISCONNECT ENDPOINT
app.post('/api/robot/disconnect', (req, res) => {
  try {
    robotState.isConnected = false;
    robotState.lastCommand = 'Disconnected';
    
    res.json({
      success: true,
      message: 'Disconnected from QBO robot',
      state: robotState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET STATUS ENDPOINT
app.get('/api/robot/status', (req, res) => {
  try {
    res.json({
      success: true,
      ...robotState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// SEND COMMAND ENDPOINT
app.post('/api/robot/command', (req, res) => {
  try {
    const { type, parameters } = req.body;

    if (!robotState.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Robot not connected',
      });
    }

    // Handle different command types
    switch (type) {
      case 'move':
        // TODO: Send serial command: MOVE:direction,distance,speed
        robotState.position.x += parameters.distance;
        robotState.lastCommand = `Move ${parameters.distance}cm`;
        break;

      case 'turn':
        // TODO: Send serial command: TURN:direction,angle,speed
        robotState.position.angle += parameters.angle;
        robotState.lastCommand = `Turn ${parameters.angle}°`;
        break;

      case 'stop':
        // TODO: Send serial command: STOP
        robotState.isMoving = false;
        robotState.lastCommand = 'Stop';
        break;

      case 'dance':
        // TODO: Send serial command: DANCE:type
        robotState.lastCommand = `Dance: ${parameters.danceType}`;
        break;

      case 'light':
        // TODO: Send serial command: LIGHT:r,g,b,duration
        robotState.lastCommand = `Light: RGB(${parameters.red},${parameters.green},${parameters.blue})`;
        break;

      case 'sound':
        // TODO: Send serial command: SOUND:type,volume
        robotState.lastCommand = `Sound: ${parameters.soundType}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown command type',
        });
    }

    // Simulate battery drain
    robotState.battery = Math.max(0, robotState.battery - Math.random() * 2);

    res.json({
      success: true,
      message: 'Command sent',
      state: robotState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   QBO Robot Control Server Started     ║
║   http://localhost:${PORT}/api         ║
║                                        ║
║   Endpoints:                           ║
║   POST   /api/robot/connect            ║
║   POST   /api/robot/disconnect         ║
║   GET    /api/robot/status             ║
║   POST   /api/robot/command            ║
║   GET    /api/health                   ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
