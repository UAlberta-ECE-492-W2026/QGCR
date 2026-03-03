# QBO Robot Control App - Testing Guide

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- QBO robot with control server running

### Installation & Setup

```bash
# Navigate to project directory
cd /Users/russellreid/Downloads/ECE492/qbomobileapp

# Install dependencies (if not already installed)
npm install

# Or if you prefer yarn
yarn install

# Start the Expo dev server
npm start
# Or: npx expo start
```

## Running the App

### Option 1: iOS Simulator (Mac only)
```bash
npm start
# Press 'i' to launch iOS simulator
```

### Option 2: Android Emulator
```bash
npm start
# Press 'a' to launch Android emulator
```

### Option 3: Physical Device
```bash
npm start
# Scan QR code with Expo Go app
```

## Testing Each Feature

### 1. Connection Management
```
Test: Connection Button
├─ Launch app
├─ Click "Connect" button
├─ Verify:
│  ├─ "Connecting..." text shows
│  ├─ Loading indicator spins
│  ├─ Voice feedback: "Connected to QBO robot"
│  ├─ Status indicator turns 🟢 green
│  ├─ "Connect" button becomes disabled
│  └─ "Disconnect" button becomes enabled
├─ Click "Disconnect" button
└─ Verify:
   ├─ Status indicator turns ⚪ gray
   ├─ Voice feedback: "Disconnected from robot"
   └─ All control buttons become disabled
```

### 2. Movement Controls
```
Test: Arrow Button Controls
├─ Connect to robot first
├─ Click ⬆️ (Forward)
│  ├─ Verify voice: "Moving forward"
│  ├─ Verify log entry: "Move Forward" with timestamp
│  └─ Verify activity: 🚀 "Moved forward"
├─ Click ⬇️ (Backward)
│  ├─ Verify voice: "Moving backward"
│  ├─ Verify log entry: "Move Backward"
│  └─ Verify activity: 🚀 "Moved backward"
├─ Click ⬅️ (Left)
│  ├─ Verify voice: "Turning left"
│  ├─ Verify log entry: "Turn Left"
│  └─ Verify activity: 🚀 "Turned left"
├─ Click ➡️ (Right)
│  ├─ Verify voice: "Turning right"
│  ├─ Verify log entry: "Turn Right"
│  └─ Verify activity: 🚀 "Turned right"
└─ Click ⏹️ (Stop)
   ├─ Verify voice: "Robot stopped"
   ├─ Verify log entry: "STOP"
   └─ Verify activity: 🚀 "Stopped"
```

### 3. Emergency Stop Button
```
Test: Safety Control
├─ At top of screen, locate red button labeled "🛑"
├─ Click the red button
├─ Verify: Confirmation dialog appears
├─ Click "STOP" in confirmation
├─ Verify:
│  ├─ "STOP" command logged immediately
│  ├─ Robot motion halts
│  └─ Activity shows 🚀 "Stopped"
└─ Click elsewhere to dismiss (or click "STOP" again)
```

### 4. Battery Warning
```
Test: Low Battery Alert
├─ With robot connected
├─ Check battery warning section
├─ Scenarios:
│  ├─ Battery > 40%: No warning shown
│  ├─ Battery 20-40%: Yellow 🟡 "Battery low" warning
│  ├─ Battery 10-20%: Orange 🟠 "Battery warning" message
│  └─ Battery < 10%: Red 🔴 "CRITICAL BATTERY" alert
└─ Verify: Warning disappears when battery charges above threshold
```

### 5. Connection Status Indicator
```
Test: Real-time Status
├─ Observe status box near top of screen
├─ States should show:
│  ├─ Disconnected: ⚪ "Not Connected"
│  ├─ Connecting: 🟡 "Connecting..." (with spinner)
│  ├─ Connected: 🟢 "Connected"
│  └─ Error: 🔴 "Connection Error" (with error message)
└─ Verify: Updates instantly when connection changes
```

### 6. Animation & Effects
```
Test: Dance
├─ Click 💃 "Dance" button
├─ Verify:
│  ├─ Robot performs dance animation
│  ├─ Voice feedback: "Dancing"
│  ├─ Log entry: "Dance" with duration
│  └─ Activity: 💃 "Dance animation"

Test: Light Colors
├─ Click color buttons (Red, Green, Blue, White)
├─ For each color:
│  ├─ Robot LED changes color
│  ├─ Voice feedback: "Light set to [Color]"
│  ├─ Log entry: "Light: [Color]"
│  └─ Activity: 💡 "Light changed" with color name
```

### 7. Robot Position Map
```
Test: Visual Positioning
├─ Look at "Position & Orientation" section
├─ Verify map shows:
│  ├─ Blue circle at current robot position
│  ├─ Arrow showing robot direction
│  ├─ Grid background for reference
│  └─ X/Y coordinates (0-100 scale)
├─ Execute movement commands
└─ Verify: Position indicator updates (if robot reports position)
```

### 8. Multi-Robot Support
```
Test: Robot Selector
├─ Scroll to "Robot:" section
├─ Click robot selector area
├─ Verify modal appears showing:
│  ├─ Current robot: "QBO-1"
│  ├─ Input fields for name and address
│  └─ Add/Remove buttons
├─ Add new robot:
│  ├─ Enter name: "QBO-2"
│  ├─ Enter address: "192.168.1.100:3000"
│  ├─ Click Add
│  └─ Verify robot appears in list
├─ Switch robots:
│  ├─ Tap different robot in list
│  └─ Verify header updates to show "Robot: QBO-2"
└─ Remove robot:
   ├─ Swipe left on robot entry
   └─ Click delete button
```

### 9. Command History & Routines
```
Test: Command Logging
├─ Execute several robot commands
├─ Scroll to "Commands & Routines" section
├─ Verify in Command Log:
│  ├─ Latest commands appear at top
│  ├─ Each entry shows:
│  │  ├─ Command name
│  │  ├─ Status icon (✓/✗/⏳)
│  │  ├─ Timestamp (HH:MM:SS)
│  │  └─ Duration in milliseconds
│  ├─ Maximum 20 entries displayed
│  └─ Scroll to see older commands

Test: Save Routine
├─ Execute a sequence of commands manually
├─ Click "Save Routine" button
├─ Enter routine name: "Test Sequence"
├─ Click Save
├─ Verify routine appears in list

Test: Replay Routine
├─ Click on saved routine
├─ Verify confirmation dialog
├─ Click "Replay"
├─ Watch robot execute saved sequence
└─ Verify same commands logged again
```

### 10. Activity Log
```
Test: Activity Tracking
├─ Perform various actions (move, dance, light, connect, etc.)
├─ Scroll to "Activity Log" section
├─ Verify entries show:
│  ├─ Color-coded icon by type:
│  │  ├─ 🚀 Movement (blue)
│  │  ├─ 💃 Animation (purple)
│  │  ├─ 💡 Light (yellow)
│  │  ├─ 🔊 Sound (green)
│  │  ├─ 🔗 Connection (red)
│  │  └─ 💬 Chat (cyan)
│  ├─ Action description
│  ├─ Status (success/failed)
│  ├─ Timestamp
│  └─ Additional details
├─ Maximum 50 entries maintained
└─ Verify: Scroll through activity history
```

### 11. Performance Metrics
```
Test: Metrics Display
├─ Execute 5-10 commands
├─ Scroll to "Performance Metrics" section
├─ Verify metrics grid shows:
│  ├─ "Total Commands": Count increases with each action
│  ├─ "Successful": Increases for successful commands
│  ├─ "Failed": Shows 0 if all successful
│  ├─ "Success Rate": Should be 100% if all successful
│  ├─ "Avg Latency": Average command time (ms)
│  └─ "Uptime": Elapsed time since connection (MM:SS)
├─ Execute a failing command
└─ Verify: Failed count increases, success rate decreases
```

### 12. Voice Feedback
```
Test: Text-to-Speech
├─ Ensure device volume is on (not muted)
├─ Execute each command type:
│  ├─ "Connect" button → "Connected to QBO robot"
│  ├─ Move forward → "Moving forward"
│  ├─ Turn left → "Turning left"
│  ├─ Dance → "Dancing"
│  ├─ Light color → "Light set to Red/Green/Blue/White"
│  └─ Disconnect → "Disconnected from robot"
└─ Verify: All voice feedback plays clearly
```

### 13. Offline Queue (Requires Disconnection)
```
Test: Offline Command Queuing
├─ Connect to robot
├─ Simulate disconnection:
│  ├─ Unplug robot
│  ├─ Or disable robot server
│  └─ Connection status changes to 🔴 error
├─ Execute commands while offline:
│  ├─ Click movement buttons
│  ├─ Click light colors
│  └─ Verify: "N command(s) queued (offline)" indicator shows
├─ Reconnect robot
├─ Verify: Queued commands execute automatically
└─ Check: All commands appear in log with proper timestamps
```

### 14. Error Handling
```
Test: Connection Error
├─ Try connecting with invalid robot address
├─ Verify:
│  ├─ Status shows 🔴 error
│  ├─ Error message displays
│  ├─ Log shows failed attempt
│  └─ Activity log records connection error

Test: Command Failure
├─ (Requires intentional failure scenario)
├─ If command fails, verify:
│  ├─ Log shows ✗ failed status
│  ├─ Error message displayed
│  ├─ Activity log records failure
│  └─ Failure count in metrics increases
```

## Performance Testing

```
Test: App Performance
├─ Rapid button clicks
│  ├─ Execute 20+ commands quickly
│  ├─ Verify: App stays responsive
│  ├─ Verify: No crashes or freezes
│  └─ Verify: All logs complete
├─ Scroll performance
│  ├─ Scroll through long command/activity logs
│  ├─ Verify: Smooth scrolling
│  └─ Verify: No lag with 50+ entries
├─ Memory usage
│  ├─ Monitor device memory
│  └─ Verify: No significant leaks over 30-min session
```

## Troubleshooting

### App Won't Connect
- Verify QBO robot is running
- Check robot IP address/port
- Ensure device is on same network
- Check firewall settings

### Voice Feedback Not Playing
- Check device volume (not muted)
- Verify app has microphone/speaker permissions
- Check `expo-speech` installation
- Try Android: Emulator might need TTS engine installed

### Commands Not Executing
- Verify robot is connected (🟢 green status)
- Check queue for offline commands
- Verify network connection
- Check robot error logs

### Performance Issues
- Close other apps
- Restart app
- Clear cache: `npm start -- -c`
- Check device storage space

## Advanced Testing

### Load Testing
```bash
# Execute many commands rapidly
for i in {1..100}; do
  # Send commands via API
  curl http://localhost:3000/move
done

# Monitor:
# - Command log size
# - Memory usage
# - UI responsiveness
```

### Network Latency Testing
```
1. Check "Avg Latency" in metrics
2. Expected ranges:
   - Local (same network): 10-50ms
   - Remote (cloud relay): 50-200ms
   - Poor connection: 200ms+

3. Slow latency indicators:
   - Delay between tap and voice feedback
   - Command log shows high duration
   - Metrics show high average latency
```

## Success Criteria

- ✅ All buttons respond immediately
- ✅ Voice feedback plays for every action
- ✅ Command log captures all actions with timestamps
- ✅ Activity log updates in real-time
- ✅ Metrics calculate correctly
- ✅ No crashes or freezes
- ✅ Smooth scrolling through lists
- ✅ Robot responds to all commands
- ✅ Emergency stop works instantly
- ✅ Battery warning displays correctly

## Notes

- Tests can run on simulator or real device
- Network tests require actual robot connection
- Some tests (like low battery) may require device simulation
- Performance metrics are more meaningful with real robot
- Voice feedback requires working speaker/TTS engine

## Contact & Support

If you encounter issues:
1. Check command log for timestamps
2. Review activity log for error details
3. Verify robot connection status
4. Check app console for errors
5. Consult robot documentation for API details
