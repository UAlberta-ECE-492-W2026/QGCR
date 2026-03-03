# QBO Robot Control App - Complete Setup Guide

## Project Overview

This is a full-stack React Native application for controlling a QBO robot. The app includes:

- **Frontend**: React Native mobile app (iOS, Android, Web)
- **Backend**: Node.js/Express API server
- **Communication**: RESTful HTTP API between app and server
- **Robot Control**: Serial port communication to QBO robot hardware

## Frontend Setup

### 1. Install Dependencies

The frontend uses Expo for cross-platform development. All dependencies are already configured in `package.json`.

```bash
cd qbomobileapp
npm install
```

### 2. Required Dependencies Added

The following new packages are used for robot control:

- **React Native Paper** (optional): For enhanced UI components
- Native React/Expo APIs for HTTP requests

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_SERVER_IP:3000/api
```

**For Testing Locally:**
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:3000/api`

### 4. Start the App

```bash
# For iOS Simulator
npm run ios

# For Android
npm run android

# For Web
npm run web

# For Expo preview (QR code)
npm start
```

## Frontend Architecture

### Directory Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation setup
│   ├── index.tsx            # QBO Control Screen (MAIN)
│   └── explore.tsx          # Settings screen (tinker robot defaults)
├── _layout.tsx              # Root layout
└── modal.tsx                # Modal screens

components/
├── control-pad.tsx          # 5-button directional pad
├── robot-status-display.tsx # Status indicator with battery
├── quick-action-button.tsx  # Reusable action buttons
├── themed-text.tsx          # Dark/light mode text
├── themed-view.tsx          # Dark/light mode view
└── ui/
    ├── collapsible.tsx
    ├── icon-symbol.tsx
    └── icon-symbol.ios.tsx

hooks/
├── use-qbo-robot.ts         # MAIN: Robot control hook
├── use-color-scheme.ts
└── use-theme-color.ts

constants/
└── theme.ts                 # App theming
```

### Key Components

#### 1. **useQboRobot Hook** (`hooks/use-qbo-robot.ts`)

The main hook that manages all robot communication:

```typescript
const {
  status,              // Current robot state
  connect,            // Connect to robot
  disconnect,         // Disconnect from robot
  move,               // Move forward/backward
  turn,               // Turn left/right
  stop,               // Stop movement
  dance,              // Play dance animation
  setLight,           // Control RGB LED
  playSound,          // Play sound effects
  sendCommand,        // Send raw command
} = useQboRobot();
```

#### 2. **ControlPad Component** (`components/control-pad.tsx`)

5-button directional control interface:
- Up/Down: Forward/Backward movement
- Left/Right: Rotate left/right
- Center: Stop button

#### 3. **RobotStatusDisplay Component** (`components/robot-status-display.tsx`)

Shows real-time robot status:
- Connection state
- Battery level (with color indicator)
- Current position and angle
- Last executed command
- Error messages

#### 4. **QuickActionButton** (`components/quick-action-button.tsx`)

Reusable button component with multiple size/color options for:
- Dance
- Sound effects
- LED control
- etc.

## Backend Setup

### 1. Create Backend Project

```bash
mkdir qbo-robot-backend
cd qbo-robot-backend
npm init -y
```

### 2. Install Backend Dependencies

```bash
npm install express cors dotenv serialport
npm install --save-dev nodemon  # For development
```

### 3. Create File Structure

See `BACKEND_IMPLEMENTATION_GUIDE.md` for detailed file structure and implementation.

### 4. Key Backend Files to Create

1. **server.js** - Express server setup
2. **services/qboRobotService.js** - Robot communication layer
3. **controllers/robotController.js** - API request handlers
4. **routes/robot.js** - API endpoints
5. **config/robot-config.js** - Configuration
6. **.env** - Environment variables

### 5. Run Backend Server

```bash
npm start
# Server will run on http://localhost:3000
```

## API Integration Flow

### 1. User Opens App
```
App → useQboRobot Hook initializes
  → Status set to "Disconnected"
```

### 2. User Clicks "Connect"
```
App → POST /api/robot/connect
  → Backend initializes serial connection to QBO robot
  → Returns connection status and robot state
  → App updates UI with connection status
```

### 3. User Presses Movement Button
```
App → POST /api/robot/command
  Body: { type: "move", parameters: { distance: 20, speed: 100 } }
  → Backend sends serial command: "MOVE:1,20,100\n"
  → QBO robot executes movement
  → Backend monitors robot response
  → Backend returns status update
  → App polls for updated position every 2 seconds
```

### 4. Continuous Status Updates
```
App → GET /api/robot/status (every 2 seconds)
  → Backend reads current robot state
  → Returns: battery, position, isMoving, etc.
  → App updates UI display
```

## Testing Checklist

### Frontend Testing
- [ ] App connects to backend
- [ ] Status displays correctly
- [ ] Control pad buttons work
- [ ] Quick action buttons are visible
- [ ] Light/dark mode works
- [ ] All tabs are accessible

### Backend Testing
- [ ] Server starts without errors
- [ ] `/api/robot/connect` endpoint works
- [ ] `/api/robot/status` returns valid data
- [ ] `/api/robot/command` accepts commands
- [ ] Serial communication with robot works
- [ ] Error handling works properly

### Hardware Testing
- [ ] QBO robot powers on
- [ ] Serial cable connected
- [ ] Robot responds to commands
- [ ] LED control works
- [ ] Sound playback works
- [ ] Movement is accurate

## Troubleshooting

### App Won't Connect to Backend
```
Solution:
1. Ensure backend server is running
2. Check EXPO_PUBLIC_API_URL in .env
3. Verify network connectivity
4. Check firewall settings
```

### Backend Server Won't Start
```
Solution:
1. Check Node.js version (requires 14+)
2. Verify all dependencies installed
3. Check port 3000 not in use: lsof -i :3000
4. Verify .env file exists with valid values
```

### Robot Not Responding
```
Solution:
1. Check QBO robot power
2. Verify USB/serial cable
3. Check serial port in .env matches actual port
4. Try different baud rate if needed
5. Restart both backend and robot
```

### API Timeout Errors
```
Solution:
1. Check network latency
2. Reduce polling frequency if needed
3. Increase timeout values in code
4. Check if robot is unresponsive
```

## Performance Tips

1. **Reduce Polling Frequency**: Change interval in `use-qbo-robot.ts` (currently 2000ms)
2. **Add Command Queuing**: Implement queue system in backend for multiple commands
3. **Optimize Serial Communication**: Use event listeners instead of polling
4. **Add Caching**: Cache robot state locally to reduce API calls

## Security Considerations

For production deployment:

1. **Add Authentication**
   ```javascript
   // Add JWT token validation
   const verifyToken = (req, res, next) => { ... }
   ```

2. **Add CORS Configuration**
   ```javascript
   app.use(cors({
     origin: ['https://yourdomain.com'],
     credentials: true
   }));
   ```

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Input Validation**
   ```bash
   npm install joi
   ```

## Environment Variables Reference

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Backend (.env)
```
PORT=3000
ROBOT_PORT=/dev/ttyUSB0
ROBOT_BAUDRATE=9600
ROBOT_TYPE=qbo
NODE_ENV=development
```

## Deployment

### Frontend Deployment
```bash
# Build for production
expo build:web

# Deploy to Vercel, Netlify, or your server
```

### Backend Deployment
```bash
# Deploy to Heroku, AWS, DigitalOcean, etc.
# Ensure NODE_ENV=production
# Use process manager like PM2
npm install -g pm2
pm2 start server.js --name qbo-robot-api
```

## Advanced Features (Optional)

### 1. WebSocket for Real-Time Updates
```bash
npm install socket.io socket.io-client
```

### 2. Autonomous Movement/Navigation
Implement path planning with backend processing

### 3. Remote Viewing
Add camera support to view robot perspective

### 4. Command Recording
Record and replay movement sequences

### 5. Multi-Robot Support
Manage multiple QBO robots from single app

## Resources

- **QBO Robot Documentation**: Check manufacturer's protocol
- **React Native Docs**: https://reactnative.dev
- **Expo Docs**: https://docs.expo.dev
- **Express Docs**: https://expressjs.com

## Support & Next Steps

For issues or questions:
1. Check BACKEND_IMPLEMENTATION_GUIDE.md
2. Review error logs from both app and server
3. Test endpoints with Postman/curl
4. Check QBO robot documentation
