# Python 2 → Python 3 Migration

This document records every change made to upgrade the `qbo_gitlab` codebase from Python 2 to Python 3.

---

## Files Changed

| File | Changes |
|------|---------|
| `Feel.py` | Shebang, encoding, print statements, `os.write` bytes |
| `FindFace.py` | Shebang, encoding, print statements, `cv2.cv` namespace, `os.write` bytes |
| `Listen.py` | Shebang, encoding, print statements, `os.write` bytes |
| `ListAndSay.py` | Shebang, encoding, `os.write` bytes |
| `ListenBackground.py` | Shebang, encoding, `os.write` bytes |
| `PiCmd.py` | Shebang, encoding, ~40 print statements, `os.write` bytes |
| `PiCmdLine.py` | Shebang, encoding, `raw_input`, print statements |
| `PiFace.py` | Shebang, encoding, print statements, `cv2.cv` namespace |
| `PiFaceFast.py` | Shebang, `import thread`, `import imp`, print statements, `cv2.cv` namespace, `_thread` calls |
| `PiFace_imgFile.py` | Shebang, encoding, print statements, `cv2.cv` namespace |
| `RTQR.py` | Shebang, encoding |
| `Say.py` | Shebang, encoding, print statements |
| `Speak.py` | Shebang, encoding |
| `Start.py` | Shebang, encoding |
| `Stop.py` | Shebang (encoding kept — contains Latin-1 characters) |
| `ServoConfig.py` | Shebang, encoding, print statements |
| `VisualRecognition.py` | Shebang, encoding, `from __future__`, `raw_input` |
| `controller/QboController.py` | Shebang, encoding, old-style classes, `has_key()`, `ord(i)` on bytes iterator, print statements, indentation fix |
| `assistants/QboTalk.py` | Shebang, encoding, old-style class, print statements |
| `assistants/QboTalkMycroft.py` | Shebang, encoding, old-style class |
| `assistants/QboMyCroft.py` | Shebang |
| `assistants/QboDialogFlowV2.py` | Shebang, encoding, old-style class, print statements |
| `assistants/QboGAssistant.py` | Shebang, encoding, old-style class, `thread.isAlive()` |
| `assistants/QboWatson.py` | Shebang, encoding, old-style class, print statements, `.encode("utf-8")` misuse |
| `web/manage.py` | Shebang, Python 2 comment |
| `web/panel/apps.py` | `from __future__ import unicode_literals` |
| `web/panel/urls.py` | `from __future__ import unicode_literals` |
| `web/panel/tests/test_move_text.py` | `from __future__ import unicode_literals` |
| `web/panel/views/moves_views.py` | `import imp`, `except E, e:` syntax error |

---

## Change Categories

### 1. Shebangs

All scripts updated from `#!/usr/bin/env python2`, `#!/usr/bin/env python`, or `#!/usr/bin/python` to:

```python
#!/usr/bin/env python3
```

Affected files: all 22 Python scripts.

---

### 2. Encoding Declarations

Removed `# -*- coding: latin-1 -*-` from files with ASCII-only source content. Python 3 defaults to UTF-8, making this declaration unnecessary for pure-ASCII files.

**Kept** for files with actual Latin-1 encoded bytes in string literals:
- `Stop.py` — contains `í` in `"Adíos"`
- `PiFaceFast.py` — contains `ó` in Spanish speech strings

---

### 3. `print` Statement → Function

Python 3 requires parentheses around `print` arguments. ~80+ statements converted.

```python
# Before
print "Open serial port sucessfully."
print "Error: " + str(e)
print "PID: " + str(pid)

# After
print("Open serial port sucessfully.")
print("Error: " + str(e))
print("PID: " + str(pid))
```

Affected files: `Feel.py`, `PiCmd.py`, `PiCmdLine.py`, `PiFace.py`, `PiFaceFast.py`, `PiFace_imgFile.py`, `ServoConfig.py`, `Say.py`, `QboTalk.py`, `QboWatson.py`, `QboDialogFlowV2.py`, `QboController.py`.

---

### 4. `raw_input` → `input`

`raw_input` was removed in Python 3; `input()` now covers both use cases.

```python
# Before
line = raw_input('QBO_>> ')
raw_input('Press Enter to capture or CTRL+C to close.')

# After
line = input('QBO_>> ')
input('Press Enter to capture or CTRL+C to close.')
```

Affected files: `PiCmdLine.py`, `VisualRecognition.py`.

---

### 5. `os.write()` — Strings Must Be Bytes

In Python 3, `os.write()` requires a `bytes` object, not `str`. All calls updated to use `.encode('utf-8')` or `b"..."` byte literals.

```python
# Before
os.write(fifo, touch_str)
os.write(fifo, talk.strAudio)
os.write(fifo, "-c nose -co red")

# After
os.write(fifo, touch_str.encode('utf-8'))
os.write(fifo, talk.strAudio.encode('utf-8'))
os.write(fifo, b"-c nose -co red")
```

Affected files: `Feel.py`, `FindFace.py`, `Listen.py`, `PiCmd.py`, `ListAndSay.py`, `ListenBackground.py`.

---

### 6. `dict.has_key()` → `in` Operator

`dict.has_key()` was removed in Python 3.

```python
# Before
if self.cmd_params.has_key(cmd) == False:
    return 0

# After
if cmd not in self.cmd_params:
    return 0
```

Affected file: `controller/QboController.py`.

---

### 7. `import thread` → `import _thread`

The `thread` module was renamed to `_thread` in Python 3.

```python
# Before
import thread
...
thread.start_new_thread(WaitForSpeech, ())
thread.start_new_thread(WaitTouchMove, ())

# After
import _thread
...
_thread.start_new_thread(WaitForSpeech, ())
_thread.start_new_thread(WaitTouchMove, ())
```

Affected file: `PiFaceFast.py`.

---

### 8. `import imp` → `importlib.util`

The `imp` module was deprecated in Python 3.4 and removed in Python 3.12.

```python
# Before
import imp
...
speak = imp.load_source(
    'speak',
    '{}/../../../Speak.py'.format(os.path.dirname(os.path.abspath(__file__)))
)

# After
import importlib.util
...
_speak_path = '{}/../../../Speak.py'.format(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('speak', _speak_path)
speak = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(speak)
```

Affected files: `PiFaceFast.py` (removed), `web/panel/views/moves_views.py` (replaced).

---

### 9. Exception Syntax: `except E, e:` → `except E as e:`

The old comma syntax is a **SyntaxError** in Python 3 — the file cannot even be parsed.

```python
# Before
except (IOError, ImportError), e:
    return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# After
except (IOError, ImportError) as e:
    return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

Affected file: `web/panel/views/moves_views.py`.

---

### 10. `ord(i)` on Bytes Iterator

In Python 2, iterating over a `str` (bytes) yields single-character strings, requiring `ord()` to get the integer value. In Python 3, iterating over `bytes` yields `int`s directly — calling `ord()` on an `int` raises `TypeError`.

```python
# Before
for i in rdBuffer:
    x = ord(i)
    if x == self.INPUT_FLAG:
        ...

# After
for x in rdBuffer:
    if x == self.INPUT_FLAG:
        ...
```

Affected file: `controller/QboController.py`.

---

### 11. `cv2.cv.*` Namespace → `cv2.*`

The `cv2.cv` sub-module (a compatibility bridge to the old C API) was removed in OpenCV 4. Constants must now be accessed directly from the `cv2` namespace.

```python
# Before
webcam.set(cv2.cv.CV_CAP_PROP_FRAME_WIDTH, 320)
webcam.set(cv2.cv.CV_CAP_PROP_FRAME_HEIGHT, 240)
frontalface.detectMultiScale(
    aframe, 1.3, 4,
    (cv2.cv.CV_HAAR_DO_CANNY_PRUNING +
     cv2.cv.CV_HAAR_FIND_BIGGEST_OBJECT +
     cv2.cv.CV_HAAR_DO_ROUGH_SEARCH),
    (60, 60)
)

# After
webcam.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
webcam.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
frontalface.detectMultiScale(
    aframe, 1.3, 4,
    (cv2.CASCADE_DO_CANNY_PRUNING +
     cv2.CASCADE_FIND_BIGGEST_OBJECT +
     cv2.CASCADE_DO_ROUGH_SEARCH),
    (60, 60)
)
```

Affected files: `FindFace.py`, `PiFace.py`, `PiFaceFast.py`, `PiFace_imgFile.py`.

---

### 12. `.encode("utf-8")` Misuse in Watson Integration

In Python 2, strings are byte strings by default and `.encode("utf-8")` converts them to unicode. In Python 3, strings are already unicode — calling `.encode("utf-8")` returns a `bytes` object, which would break downstream string operations (speech synthesis, formatting, etc.).

```python
# Before
print("Understood message: %s" % text.encode("utf-8"))
self.Response = message['output']['generic'][0]['text'].encode("utf-8")

# After
print("Understood message: %s" % text)
self.Response = message['output']['generic'][0]['text']
```

Affected file: `assistants/QboWatson.py`.

---

### 13. `thread.isAlive()` → `thread.is_alive()`

`isAlive()` was deprecated in Python 3.9 and removed in Python 3.12.

```python
# Before
if self.thread.isAlive():
    self.thread.join()

# After
if self.thread.is_alive():
    self.thread.join()
```

Affected file: `assistants/QboGAssistant.py`.

---

### 14. Old-Style Classes → New-Style Classes

In Python 2, classes that did not explicitly inherit from `object` were "old-style" classes with different MRO and descriptor behaviour. In Python 3 all classes implicitly inherit from `object`, but the explicit declaration was added for clarity.

```python
# Before
class Command:
class Controller:
class QBOtalk:
class QBOtalkMycroft:
class QboDialogFlowV2:
class GAssistant:
class QBOWatson:

# After
class Command(object):
class Controller(object):
class QBOtalk(object):
class QBOtalkMycroft(object):
class QboDialogFlowV2(object):
class GAssistant(object):
class QBOWatson(object):
```

Affected files: `controller/QboController.py`, `assistants/QboTalk.py`, `assistants/QboTalkMycroft.py`, `assistants/QboDialogFlowV2.py`, `assistants/QboGAssistant.py`, `assistants/QboWatson.py`.

---

### 15. `from __future__` Imports Removed

These were Python 2 compatibility shims that have no effect in Python 3 and add unnecessary noise.

```python
# Removed from web/panel/apps.py, urls.py, tests/test_move_text.py
from __future__ import unicode_literals

# Removed from VisualRecognition.py
from __future__ import print_function
```

---

### 16. `QboTalk.downsampleWav` — `str()` Fix

`wave.getframerate()` returns an `int`. Concatenating it directly to a string with `+` raises `TypeError` in both Python 2 and 3 (this was a latent bug). Added explicit `str()` conversion.

```python
# Before
print "frameRate: " + s_read.getframerate()

# After
print("frameRate: " + str(s_read.getframerate()))
```

Affected file: `assistants/QboTalk.py`.
