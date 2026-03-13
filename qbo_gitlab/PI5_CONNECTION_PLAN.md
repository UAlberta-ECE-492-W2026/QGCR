# QBO Pi 5 Connection Plan

## Problem Summary

The QBO software was designed for a **Raspberry Pi 3** running **Raspbian Stretch**.
We are running on a **Raspberry Pi 5** with modern Raspberry Pi OS (Bookworm).
Several hardware and software layers need to be verified and fixed for the robot to work.

---

## Architecture Overview

```
Your Mac (Browser)
    │  HTTP over WiFi (same hotspot)
    ▼
Raspberry Pi 5 — Django (port 8000)
    │  reads/writes config.yml
    ▼
/opt/qbo/config.yml  ←  shared config

Named Pipes (/opt/qbo/pipes/)
    │
    ├── PiFaceFast.py   ← main brain
    ├── PiCmd.py        ← command processor
    ├── Say.py          ← text to speech
    ├── Feel.py         ← touch sensors
    └── FindFace.py     ← face detection
            │
            │  UART Serial (/dev/serial0)
            ▼
    Servo Controller Board
            │
            ├── Servo motors (head movement)
            ├── Nose LED
            └── Touch sensors
```

---

## Step 1 — Deploy Code to the Pi

Copy the updated Python 3 code from your Mac to the Pi.

```bash
# Run on your Mac
rsync -av /Users/russellreid/Downloads/ECE492/qbo_gitlab/QBO/ pi@172.20.10.6:/opt/qbo/
```

Or push to git and pull on the Pi:

```bash
# On the Pi
cd /opt/qbo
git pull
```

---

## Step 2 — Create Required Directories and Pipes

The installer normally creates these. Do it manually on the Pi.

```bash
# SSH into the Pi first
ssh pi@172.20.10.6

# Create folders
mkdir -p /opt/qbo/pipes
mkdir -p /opt/qbo/logs
mkdir -p /opt/qbo/sounds

# Create named pipes (only if they don't already exist)
[ -p /opt/qbo/pipes/pipe_cmd ]      || mkfifo /opt/qbo/pipes/pipe_cmd
[ -p /opt/qbo/pipes/pipe_say ]      || mkfifo /opt/qbo/pipes/pipe_say
[ -p /opt/qbo/pipes/pipe_feel ]     || mkfifo /opt/qbo/pipes/pipe_feel
[ -p /opt/qbo/pipes/pipe_listen ]   || mkfifo /opt/qbo/pipes/pipe_listen
[ -p /opt/qbo/pipes/pipe_findFace ] || mkfifo /opt/qbo/pipes/pipe_findFace

# Make scripts executable
chmod +x /opt/qbo/scripts/*.sh
```

---

## Step 3 — Install Python Dependencies on the Pi

```bash
cd /opt/qbo/web
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

For the robot scripts (outside the web app):

```bash
pip3 install pyserial pyyaml opencv-python SpeechRecognition pyaudio apiai
```

---

## Step 4 — Fix the Serial Port (Pi 5 Specific)

The Pi 5 changed the UART hardware. `/dev/serial0` may not exist or may point
to the wrong device.

### Check what serial devices exist

```bash
ls -la /dev/serial*
ls /dev/tty*
```

### Enable UART in the Pi 5 boot config

```bash
sudo nano /boot/firmware/config.txt
```

Add these lines at the bottom:

```
enable_uart=1
dtoverlay=disable-bt
```

Then reboot:

```bash
sudo reboot
```

### After reboot, verify

```bash
ls -la /dev/serial0
# Should now exist and point to /dev/ttyAMA0
```

### If serial0 doesn't exist, pass the port manually

```bash
python3 /opt/qbo/PiFaceFast.py /dev/ttyAMA0
```

---

## Step 5 — Verify config.yml

```bash
cat /opt/qbo/config.yml
```

Make sure `startWith` is set to `interactive-dialogflow` (or whichever mode you want).
It must NOT be `develop` — that mode intentionally skips launching PiFaceFast.

Minimum working config:

```yaml
language: english
volume: 100
camera: 0
distro: standalone
startWith: interactive-dialogflow
servoSpeed: 100
headYPosition: 39
microphoneGain: 100
SpeechToTextListeningTime: 5
tokenAPIai: ""
gassistant_proyectid: ""
dialogflowv2_projectid: ""
```

---

## Step 6 — Test the Serial Connection

Before running the full robot, test that the serial port and servo board are communicating.

```bash
cd /opt/qbo
python3 ServoConfig.py --help
```

Or run a minimal serial test:

```python
import serial
ser = serial.Serial('/dev/serial0', 115200, timeout=1)
print("Serial port opened:", ser.name)
ser.close()
```

If this errors, the serial port isn't ready — go back to Step 4.

---

## Step 7 — Run PiFaceFast Directly

Skip `Start.py` and run the main robot script directly so you can see any errors:

```bash
cd /opt/qbo
python3 PiFaceFast.py
```

Watch the output. Common errors and fixes:

| Error | Fix |
|-------|-----|
| `No module named 'serial'` | `pip3 install pyserial` |
| `No module named 'cv2'` | `pip3 install opencv-python` |
| `No module named 'snowboy'` | See Step 8 below |
| `No module named 'apiai'` | `pip3 install apiai` |
| `could not open port /dev/serial0` | Fix serial port (Step 4) |
| `No module named 'Speak'` | Run from `/opt/qbo/` not a subdirectory |

---

## Step 8 — Snowboy Hotword Detection (Known Issue)

Snowboy (`from snowboy.snowboythreaded import ThreadedDetector`) is a discontinued
library that does not support Python 3 or the Pi 5 out of the box.

### Option A — Skip hotword detection (quickest)

Comment out the snowboy import and `StartHotwordListener()` calls in `PiFaceFast.py`.
The robot will still do face tracking and respond to faces, just not to the
"Hi QBO" spoken hotword.

```python
# from snowboy.snowboythreaded import ThreadedDetector  ← comment this out
```

And replace `StartHotwordListener()` / `StopHotwordListener()` calls with `pass`.

### Option B — Use openWakeWord (replacement)

Install a modern hotword library:

```bash
pip3 install openwakeword
```

This would require rewriting the hotword detection section of `PiFaceFast.py`.

---

## Step 9 — Start the Web Server on the Pi

```bash
cd /opt/qbo/web
source venv/bin/activate
python3 manage.py runserver 0.0.0.0:8000
```

Access from your Mac at: `http://172.20.10.6:8000`

---

## Step 10 — Auto-start on Boot (Optional)

Once everything works manually, set it to start on boot using crontab:

```bash
sudo crontab -e
```

Add these lines:

```
@reboot sleep 10 && cd /opt/qbo && python3 Start.py
@reboot sleep 15 && cd /opt/qbo/web && /opt/qbo/web/venv/bin/python3 manage.py runserver 0.0.0.0:8000
```

---

## Checklist

- [ ] Code deployed to `/opt/qbo/` on the Pi
- [ ] Named pipes created in `/opt/qbo/pipes/`
- [ ] Python dependencies installed on the Pi
- [ ] Serial port enabled and verified (`/dev/serial0` exists)
- [ ] `config.yml` has correct `startWith` value
- [ ] Serial connection to servo board tested
- [ ] `python3 PiFaceFast.py` runs without import errors
- [ ] Snowboy replaced or disabled
- [ ] Web server runs on Pi and accessible from Mac
- [ ] Robot responds to face detection and moves head

---

## Known Limitations on Pi 5

| Feature | Status | Notes |
|---------|--------|-------|
| Serial/UART | Needs config | Different hardware mapping than Pi 3 |
| Snowboy hotword | Broken | Library discontinued, needs replacement |
| ScratchX checkers | Dead | scratchx.org shut down permanently |
| Face tracking | Should work | OpenCV still supported |
| Text to speech | Should work | pico2wave available on Pi OS |
| Web panel | Working | Confirmed working on local network |
