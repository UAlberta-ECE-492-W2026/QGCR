# QBO Robot Control App - Developer Quick Reference

## Quick Start (5 minutes)

### 1. Frontend Setup
```bash
cd qbomobileapp
npm install
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
npm start
```

### 2. Backend Setup
```bash
mkdir ../qbo-backend && cd ../qbo-backend
npm init -y
npm install express cors dotenv serialport
# Copy files from BACKEND_IMPLEMENTATION_GUIDE.md
npm start
```

### 3. Test Connection
```bash
# In new terminal
curl -X POST http://localhost:3000/api/robot/connect
```

## File Tree with Descriptions

```
qbomobileapp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              ⭐ MAIN: Robot control UI
│   │   ├── explore.tsx            ⚙️ Settings screen
│   │   └── _layout.tsx            Bottom tab navigation
│   └── _layout.tsx                Root navigation
├── components/
│   ├── control-pad.tsx            ⭐ 5-button movement pad
│   ├── robot-status-display.tsx   ⭐ Battery/status info
│   ├── quick-action-button.tsx    ⭐ Action buttons (dance, light, etc)
│   └── ...other UI components
├── hooks/
│   ├── use-qbo-robot.ts           ⭐ MAIN: Robot API hook
│   └── ...other hooks
├── constants/
│   └── theme.ts                   Colors & styling
├── SETUP_GUIDE.md                 📖 Complete setup guide
└── BACKEND_IMPLEMENTATION_GUIDE.md 📖 Backend API guide
```

## Hook Usage Examples

### Basic Connection

```typescript
import { useQboRobot } from '@/hooks/use-qbo-robot';

export default function MyComponent() {
  const robot = useQboRobot();
  
  return (
    <>
      <Text>Connected: {robot.status.isConnected ? 'Yes' : 'No'}</Text>
      <Button 
        title="Connect" 
        onPress={() => robot.connect()}
      />
    </>
  );
}
```

### Movement Control

```typescript
const robot = useQboRobot();

// Move forward 20cm
await robot.move(20, 100);

// Turn right 90°
await robot.turn(90, 100);

// Stop
await robot.stop();
```

### LED Control

```typescript
// Set to red
await robot.setLight(255, 0, 0, 1000);

// Set to blue
await robot.setLight(0, 0, 255, 1000);

// Off
await robot.setLight(0, 0, 0);
```

### Sound & Animation

```typescript
// Play sound
await robot.playSound('chirp', 80);

// Dance
await robot.dance('default');
```

## API Endpoint Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/robot/connect` | Establish connection |
| POST | `/api/robot/disconnect` | Close connection |
| GET | `/api/robot/status` | Get current state |
| POST | `/api/robot/command` | Send command |

## Command Types & Parameters

### Move
```json
{
  "type": "move",
  "parameters": {
    "distance": 20,      // cm
    "speed": 50          // 0-100
  }
}
```

### Turn
```json
{
  "type": "turn",
  "parameters": {
    "angle": 90,         // degrees
    "speed": 50          // 0-100
  }
}
```

### Light
```json
{
  "type": "light",
  "parameters": {
    "red": 255,          // 0-255
    "green": 0,          // 0-255
    "blue": 0,           // 0-255
    "duration": 1000     // milliseconds
  }
}
```

### Sound
```json
{
  "type": "sound",
  "parameters": {
    "soundType": "chirp", // chirp|beep|laugh|alarm
    "volume": 80         // 0-100
  }
}
```

### Dance
```json
{
  "type": "dance",
  "parameters": {
    "danceType": "default" // default|spin|wave
  }
}
```

### Stop
```json
{
  "type": "stop",
  "parameters": {}
}
```

## Common Tasks

### Task: Add New Quick Action Button

1. **Open** `app/(tabs)/index.tsx`
2. **Find** the `QuickActionsGrid` section
3. **Add** new action object:
```typescript
{
  label: '🎯 New Action',
  onPress: () => robot.YOUR_FUNCTION(),
  color: 'primary',
  disabled: !robot.status.isConnected,
}
```

### Task: Modify Control Pad Behavior

1. **Open** `components/control-pad.tsx`
2. **Adjust** button sizes in `StyleSheet`
3. **Change** sensitivity in `app/(tabs)/index.tsx`:
```typescript
// Increase distance
await robot.move(50, 100); // was 20
```

### Task: Add Status Display Item

1. **Open** `components/robot-status-display.tsx`
2. **Add** new status row:
```typescript
<View style={styles.statusRow}>
  <ThemedText style={styles.label}>New Status:</ThemedText>
  <ThemedText style={styles.value}>
    {robot.status.newField}
  </ThemedText>
</View>
```

### Task: Add New Backend Command

1. **Update** `services/qboRobotService.js` with new method
2. **Add** case in `controllers/robotController.js`
3. **Add** function to `hooks/use-qbo-robot.ts`
4. **Use** in component via hook

Example:
```typescript
// In service
async customCommand(param1) {
  const cmd = `CUSTOM:${param1}\n`;
  await this.sendRawCommand(cmd);
}

// In hook
const customCommand = useCallback(async (param1) => {
  return sendCommand({
    type: 'custom',
    parameters: { param1 }
  });
}, [sendCommand]);

// In component
await robot.customCommand('value');
```

## Debugging Tips

### Check App Logs
```bash
# Terminal running npm start
# Scroll through output or use React Native debugger
```

### Check Backend Logs
```bash
# Terminal running npm start (backend)
# Shows all API requests and robot responses
```

### Test API with cURL
```bash
# Get robot status
curl http://localhost:3000/api/robot/status

# Send move command
curl -X POST http://localhost:3000/api/robot/command \
  -H "Content-Type: application/json" \
  -d '{"type":"move","parameters":{"distance":20,"speed":50}}'
```

### Check Network Inspector
- Open app debugger (shake device or cmd+d)
- Select Network tab
- Verify API calls are being made

## Performance Optimization

### Reduce API Polling
In `hooks/use-qbo-robot.ts`, change:
```typescript
const interval = setInterval(fetchStatus, 2000); // Change to 5000 for less frequent
```

### Add Command Queuing
Prevent overlapping commands in `controllers/robotController.js`:
```javascript
if (service.isProcessing) {
  return res.status(429).json({ success: false, message: 'Busy' });
}
```

### Cache Robot State
Store state locally in mobile app to reduce API calls.

## Environment Variables

### Frontend (.env)
```
# Local development
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Physical device
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# Production
EXPO_PUBLIC_API_URL=https://api.myserver.com
```

### Backend (.env)
```
PORT=3000
ROBOT_PORT=/dev/ttyUSB0
ROBOT_BAUDRATE=9600
NODE_ENV=development
```

## Checklist Before Deployment

- [ ] All components import correctly
- [ ] API endpoints tested with curl
- [ ] Environment variables configured
- [ ] No console errors in app
- [ ] No server errors in backend logs
- [ ] Robot responds to all commands
- [ ] Battery level updates correctly
- [ ] Position tracking works
- [ ] Error messages display properly
- [ ] UI is responsive on different screen sizes

## Resources

- **Main Guides**: SETUP_GUIDE.md, BACKEND_IMPLEMENTATION_GUIDE.md
- **React Native**: https://reactnative.dev/docs/getting-started
- **Expo**: https://docs.expo.dev
- **Express**: https://expressjs.com/en/5x/api.html
- **This Guide**: DevQuickRef.md

## Keyboard Shortcuts (Expo)

| Action | iOS/Android | Web |
|--------|-------------|-----|
| Reload | cmd+r / cmd+m | r |
| Toggle Dev Menu | cmd+d | cmd+d |
| Toggle Inspector | cmd+i | cmd+i |
