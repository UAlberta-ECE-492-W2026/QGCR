# QBO Robot Control App

A full-stack mobile application for controlling QBO robots from iOS, Android, or Web. Built with React Native/Expo, this app provides intuitive controls for movement, LED effects, sounds, and pre-programmed animations.

## Features

✨ **Core Features**
- 🎮 Directional movement control (forward, backward, left, right)
- 🎯 Precise position and angle tracking
- 🔋 Real-time battery level monitoring
- 🌈 RGB LED control with color selection
- 🔊 Sound effects and voice commands
- 💃 Pre-programmed dance animations
- 📊 Live status display and connection monitoring
- 🌓 Dark mode support

🔧 **Technical Features**
- Cross-platform (iOS, Android, Web)
- RESTful API integration
- Real-time status polling
- Error handling and recovery
- Type-safe TypeScript implementation
- Responsive UI design

## App Screenshots Overview

```
┌─────────────────────┐
│   QBO Control       │  ← Main Control Screen
│  ┌───────────────┐  │
│  │ Status Panel  │  │  ← Battery, Connection, Position
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   ↑           │  │
│  │ ← ● →         │  │  ← Control Pad
│  │   ↓           │  │
│  └───────────────┘  │
│  [Dance] [Sound]    │  ← Quick Actions
│  [Red  ] [Blue  ]   │
└─────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js (14+)
- npm or yarn
- Expo CLI (optional but recommended)
- QBO Robot with USB/Serial connection

### Quick Start

#### 1. Frontend Setup (5 minutes)

```bash
cd qbomobileapp
npm install
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
npm start
```

#### 2. Backend Setup (5 minutes)

```bash
# Open new terminal
cp QUICK_START_SERVER.js ../server.js
cd ..
npm init -y
npm install express cors dotenv
node server.js
```

#### 3. Run App

```bash
# Scan QR code from first terminal with Expo Go app
# OR press:
# i - for iOS simulator
# a - for Android emulator
# w - for web browser
```

## Architecture

### Frontend Structure

```
app/(tabs)/index.tsx          ← Main control interface
  ├─ RobotStatusDisplay       ← Status & battery
  ├─ ControlPad              ← Movement buttons
  └─ QuickActionsGrid        ← Dance, lights, sounds

hooks/use-qbo-robot.ts       ← API communication hook
```

### Backend Structure

```
server.js                     ← Express server
  ├─ /api/robot/connect      ← Establish connection
  ├─ /api/robot/disconnect   ← Close connection
  ├─ /api/robot/status       ← Get robot state
  └─ /api/robot/command      ← Send control command
```

### Data Flow

```
User taps button
    ↓
Mobile App calls useQboRobot()
    ↓
Hook sends HTTP request to backend
    ↓
Backend processes command
    ↓
Backend sends serial command to QBO robot
    ↓
Robot executes action
    ↓
Robot sends status response
    ↓
Backend updates robot state
    ↓
App polls for status updates
    ↓
UI updates with new state
```

## File Structure

```
qbomobileapp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              ⭐ Main control screen
│   │   ├── explore.tsx            ⚙️ Settings
│   │   └── _layout.tsx
│   └── _layout.tsx
├── components/
│   ├── control-pad.tsx            ⭐ Movement controls
│   ├── robot-status-display.tsx   ⭐ Status indicator
│   ├── quick-action-button.tsx    ⭐ Quick actions
│   └── ...
├── hooks/
│   ├── use-qbo-robot.ts           ⭐ Main API hook
│   └── ...
├── SETUP_GUIDE.md                 📖 Complete setup
├── BACKEND_IMPLEMENTATION_GUIDE.md 📖 Backend details
├── DEVELOPER_QUICK_REFERENCE.md   📖 Developer guide
├── QUICK_START_SERVER.js          🚀 Quick start server
└── package.json
```

## Usage

### Basic Usage

```typescript
import { useQboRobot } from '@/hooks/use-qbo-robot';

export default function ControlScreen() {
  const robot = useQboRobot();
  
  return (
    <>
      <Button 
        title="Connect" 
        onPress={() => robot.connect()}
      />
      
      <Button 
        title="Forward" 
        onPress={() => robot.move(20, 100)}
      />
      
      <Button 
        title="Turn Right" 
        onPress={() => robot.turn(90, 100)}
      />
    </>
  );
}
```

### Available Commands

| Function | Parameters | Example |
|----------|-----------|---------|
| `move()` | distance, speed | `robot.move(20, 100)` |
| `turn()` | angle, speed | `robot.turn(90, 100)` |
| `stop()` | none | `robot.stop()` |
| `dance()` | danceType | `robot.dance('spin')` |
| `setLight()` | r, g, b, duration | `robot.setLight(255, 0, 0, 1000)` |
| `playSound()` | soundType, volume | `robot.playSound('chirp', 80)` |
| `connect()` | none | `robot.connect()` |
| `disconnect()` | none | `robot.disconnect()` |

### Accessing Robot Status

```typescript
const robot = useQboRobot();

console.log(robot.status.isConnected);      // true/false
console.log(robot.status.batteryLevel);     // 0-100
console.log(robot.status.position);         // {x, y, angle}
console.log(robot.status.isMoving);         // true/false
console.log(robot.status.lastCommand);      // string
console.log(robot.status.error);            // null or error message
```

## API Reference

### Connect
```bash
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

### Get Status
```bash
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

### Send Command
```bash
POST /api/robot/command
Content-Type: application/json

Body:
{
  "type": "move",
  "parameters": { "distance": 20, "speed": 100 }
}

Response:
{
  "success": true,
  "message": "Command sent",
  "state": { ... }
}
```

## Configuration

### Frontend Environment Variables

Create `.env` file in root directory:

```env
# Local development
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# For Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# For physical device (replace with your IP)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# Production
EXPO_PUBLIC_API_URL=https://api.yourserver.com
```

### Backend Configuration

Backend `.env` file:

```env
PORT=3000
ROBOT_PORT=/dev/ttyUSB0      # Serial port (Linux/Mac)
# ROBOT_PORT=COM3             # Serial port (Windows)
ROBOT_BAUDRATE=9600
ROBOT_TYPE=qbo
NODE_ENV=development
```

## Troubleshooting

### "Cannot connect to backend"
- [ ] Verify backend server is running (`npm start` in backend directory)
- [ ] Check `EXPO_PUBLIC_API_URL` in `.env`
- [ ] Ensure firewall allows port 3000
- [ ] Check network connectivity between device and server

### "Robot not responding"
- [ ] Check QBO robot is powered on
- [ ] Verify USB cable is connected
- [ ] Check correct serial port in backend `.env`
- [ ] Try different baud rate (usually 9600)

### "Commands not executing"
- [ ] Check robot battery level
- [ ] Verify robot is in ready state
- [ ] Check backend logs for errors
- [ ] Test API endpoint with curl

### "UI not updating"
- [ ] Check app logs for errors
- [ ] Verify status polling is enabled
- [ ] Check if robot is connected
- [ ] Try refreshing the app (R key)

## Advanced Features

### Adding Custom Commands

1. **In `hooks/use-qbo-robot.ts`**, add new function:
```typescript
const myCommand = useCallback(async (param) => {
  return sendCommand({
    type: 'mycommand',
    parameters: { param }
  });
}, [sendCommand]);
```

2. **In backend controller**, add case:
```javascript
case 'mycommand':
  await service.myCommand(parameters.param);
  break;
```

3. **Use in component**:
```typescript
await robot.myCommand('value');
```

### Customizing Controls

**Move Speed**: Edit in `app/(tabs)/index.tsx`
```typescript
await robot.move(distance, 100); // Change second param
```

**Control Pad Size**: Edit `components/control-pad.tsx`
```typescript
const buttonSize = 60; // Change this value
```

**LED Colors**: Add to `QuickActionsGrid` in `index.tsx`
```typescript
{
  label: '🌈 Yellow',
  onPress: () => robot.setLight(255, 255, 0),
  color: 'warning',
}
```

## Testing

### Manual Testing Checklist
- [ ] App connects to backend
- [ ] Status displays correctly
- [ ] Movement commands work
- [ ] LED colors change
- [ ] Sounds play
- [ ] Dance animation executes
- [ ] Battery level updates
- [ ] Error handling works
- [ ] Disconnect works properly

### API Testing with curl

```bash
# Connect
curl -X POST http://localhost:3000/api/robot/connect

# Get status
curl http://localhost:3000/api/robot/status

# Move forward
curl -X POST http://localhost:3000/api/robot/command \
  -H "Content-Type: application/json" \
  -d '{"type":"move","parameters":{"distance":20,"speed":100}}'
```

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md)** - Complete backend API
- **[DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md)** - Quick reference guide

## Performance Tips

1. **Reduce polling frequency** (if battery is draining too fast)
   - Edit interval in `use-qbo-robot.ts` (currently 2000ms)

2. **Add command queuing** (prevent command overlap)
   - Implement queue system in backend

3. **Cache robot state** (reduce API calls)
   - Store locally in React Context

4. **Use WebSockets** (for real-time updates)
   - Replace polling with Socket.io

## Deployment

### Frontend
```bash
npm run build:web
# Deploy to Vercel, Netlify, or your hosting
```

### Backend
```bash
# Deploy to Heroku, AWS, DigitalOcean
# Ensure environment variables are set
npm start
```

## Dependencies

### Frontend
- React Native 0.81.5
- Expo 54.0
- React Navigation
- React Native Reanimated

### Backend
- Express 4.18+
- SerialPort 11+
- CORS
- dotenv

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT License - Feel free to use for educational and commercial projects

## Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Test with curl commands
4. Check QBO robot documentation

## Next Steps

- [ ] Read SETUP_GUIDE.md for detailed setup
- [ ] Read BACKEND_IMPLEMENTATION_GUIDE.md for backend details
- [ ] Run QUICK_START_SERVER.js to test quickly
- [ ] Customize controls to your needs
- [ ] Deploy to production

---

**Happy Controlling! 🤖🎮**
