#!/usr/bin/env python3
# -*- coding: latin-1 -*-

import os
import subprocess
import cv2
import serial
import sys
import time
import Speak
import _thread
import yaml
from assistants.QboGAssistant import GAssistant
from assistants.QboWatson import QBOWatson
from assistants.QboTalk import QBOtalk
from assistants.QboTalkMycroft import QBOtalkMycroft
from controller.QboController import Controller
from VisualRecognition import VisualRecognition
from assistants.QboDialogFlowV2 import QboDialogFlowV2
from hotword_openwakeword import OpenWakeWordListener


config = yaml.safe_load(open("/opt/qbo/config.yml"))

if config["distro"] == "ibmwatson":
	print("Mode: IBM Watson")

	if len(config['AssistantAPIKey']) < 2 and len(config['AssistantURL']) < 2 and len(config['AssistantID']) < 2 and len(config['TextToSpeechAPIKey']) < 2 and len(config['TextToSpeechURL']) < 2 and len(config['SpeechToTextAPIKey']) < 2 and len(config['SpeechToTextURL']) < 2:
		print("Warning: Missing IBM Watson configuration parameters.")
		Speak.SpeechText_2("Notice. In order to use the IBM Watson service you must specify the tokens APIs. Access the web panel, fill in the information and click on Save and restart.", "Aviso. Para poder usar el servicio IBM Watson debe especificar los API tokens. Acceda al panel web, complete los datos y presione sobre Guardar y reiniciar.", True)
		exit(0)

	talk = QBOWatson()
	interactiveTypeGAssistant = False

	Speak.SpeechText_2("Loading the IBM Watson system. Wait until I tell you that I'm ready.", "Cargando el sistema IBM Watson. Espera hasta que te diga que estoy listo.", True)
	time.sleep(10)

	talk.startThread()
	time.sleep(1)

else:
	if config["startWith"] == "interactive-dialogflow":
		print("Mode: Dialogflow")

		talk = QBOtalk()
		interactiveTypeGAssistant = False

	elif config["startWith"] == "interactive-dialogflow-v2":
		print("Mode: Dialogflow V2")

		if not os.path.isfile("/opt/qbo/.config/dialogflowv2.json"):
			print("Warning: Missing Dialogflow V2 JSON file. Set file in /opt/qbo/.config/dialogflowv2.json")
			Speak.SpeechText_2("Notice. Set the Dialogflow V2 configuration file as indicated in the instruction manual.", "Aviso. Establezca el archivo de configuraci�n de Dialogflow V2 como indica el manual de instrucciones.", True)
			exit(0)

		talk = QboDialogFlowV2()
		interactiveTypeGAssistant = False

	elif config["startWith"] == "interactive-mycroft":
		print("Mode: MyCroft")
		subprocess.call('sudo bash /opt/qbo/mycroft-core/start-mycroft.sh audio && sudo bash /opt/qbo/mycroft-core/start-mycroft.sh bus && sudo bash /opt/qbo/mycroft-core/start-mycroft.sh skills', shell=True)

		talk = QBOtalkMycroft()
		interactiveTypeGAssistant = False

	else:
		print("Mode: Google Assistant")

		if not os.path.isfile("/opt/qbo/.config/google-oauthlib-tool/credentials.json") or len(config["gassistant_proyectid"]) < 2:
			print("Warning: Missing Google Assistant JSON file or proyectid token in settings. Set file in /opt/qbo/.config/google-oauthlib-tool/credentials.json and set Project ID in settings.")
			Speak.SpeechText_2("Notice. Set the Google Assistant configuration file as indicated in the instruction manual and set the Project ID on the configuration web.", "Aviso. Establezca el archivo de configuraci�n de Google Assistant como indica el manual de instrucciones y establezca el Project ID en la web de configuraci�n.", True)
			exit(0)

		gassistant = GAssistant(config["gassistant_proyectid"], True)
		gassistant.start()
		interactiveTypeGAssistant = True

## Global Hotword defector

threaded_detector = 0

##

Kpx = 1
Kpy = 1
Ksp = 40

## Head X and Y angle limits

Xmax = 725
Xmin = 290
Ymax = 550
Ymin = 420

## Initial Head position

Xcoor = 511
Ycoor = int(Ymin + float(config["headYPosition"]) / 100 * (Ymax - Ymin))
print("Calculated initial head position: XCoor " + str(Xcoor) + ", YCoor " + str(Ycoor))
Facedet = 0

## Time head wait turned
touch_wait = 2

no_face_tm = time.time()
face_det_tm = time.time()
last_face_det_tm = time.time()
touch_tm = 0
touch_samp = time.time()
qbo_touch = 0
touch_det = False
Listening = False
WaitingSpeech = False
listen_thd = 0
face_not_found_idx = 0
mutex_wait_touch = False
faceFound = False
HotwordListened = False

if len(sys.argv) > 1:
	port = sys.argv[1]
else:
	port = '/dev/serial0'

try:
	# Open serial port
	ser = serial.Serial(port, baudrate=115200, bytesize=serial.EIGHTBITS, stopbits=serial.STOPBITS_ONE, parity=serial.PARITY_NONE, rtscts=False, dsrdtr=False, timeout=0)
	print("Open serial port sucessfully.")
	print(ser.name)

except:
	print("Error opening serial port.")
	sys.exit()

controller = Controller(ser)
vc = VisualRecognition()

try:
	controller.SetMicrophoneGain(config['microphoneGain'])
except KeyError:
	controller.SetMicrophoneGain(100)

controller.SetServo(1, Xcoor, int(config["servoSpeed"]))
controller.SetServo(2, Ycoor, int(config["servoSpeed"]))
print("Positioning head: XCoor " + str(Xcoor) + ", YCoor " + str(Ycoor))

time.sleep(1)
#controller.SetPid(1, 26, 12, 16)
controller.SetPid(1, 26, 2, 16)
time.sleep(1)
#controller.SetPid(2, 26, 12, 16)
controller.SetPid(2, 26, 2, 16)
time.sleep(1)
controller.SetNoseColor(0)  # Off QBO nose brigth

webcam = cv2.VideoCapture(int(config['camera']))  # Get ready to start getting images from the webcam
webcam.set(cv2.CAP_PROP_FRAME_WIDTH, 320)  # I have found this to be about the highest-
webcam.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)  # resolution you'll want to attempt on the pi
#webcam.set(cv2.CV_CAP_PROP_BUFFERSIZE, 2)		# frame buffer storage

if not webcam:
	print("Error opening WebCAM")
	sys.exit(1)

# Read back actual resolution in case the camera ignored the set() calls.
# Detection always runs on a 320x240 frame (resized if necessary), so the
# center used for tracking is always (160, 120) regardless of capture size.
frame_w = int(webcam.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_h = int(webcam.get(cv2.CAP_PROP_FRAME_HEIGHT))
frame_cx = 160
frame_cy = 120
print("Camera resolution: {}x{}, detect center: ({},{})".format(frame_w, frame_h, frame_cx, frame_cy))

if config["distro"] == "ibmwatson":
	talk.setWebcam(webcam)

##get webcam properties
# for i in range(0,24):
#   print webcam.get(i)

frontalface = cv2.CascadeClassifier("/opt/qbo/haarcascades/haarcascade_frontalface_alt2.xml")  # frontal face pattern detection
profileface = cv2.CascadeClassifier("/opt/qbo/haarcascades/haarcascade_profileface.xml")  # side face pattern detection

face = [0, 0, 0, 0]  # This will hold the array that OpenCV returns when it finds a face: (makes a rectangle)
Cface = [0, 0]  # Center of the face: a point calculated from the above variable
lastface = 0  # int 1-3 used to speed up detection. The script is looking for a right profile face,-
# a left profile face, or a frontal face; rather than searching for all three every time,-
# it uses this variable to remember which is last saw: and looks for that again. If it-
# doesn't find it, it's set back to zero and on the next loop it will search for all three.-
# This basically tripples the detect time so long as the face hasn't moved much.

time.sleep(1)  # Wait for them to start


def ServoHome():
	global Xcoor, Ycoor, touch_tm

	Xcoor = 511
	Ycoor = int(Ymin + float(config["headYPosition"]) / 100 * (Ymax - Ymin))
	controller.SetServo(1, Xcoor, int(config["servoSpeed"]))
	time.sleep(0.1)
	controller.SetServo(2, Ycoor, int(config["servoSpeed"]))
	touch_tm = time.time()

	print("Repositioning head: XCoor " + str(Xcoor) + ", YCoor " + str(Ycoor))

	return


def WaitForSpeech():
	global WaitingSpeech, Listening, listen_thd
	#print "WaitingSpeech " + str(WaitingSpeech)

	if config["distro"] == "ibmwatson":
		if talk.onListeningChanged:
			talk.onListeningChanged = False
			if talk.onListening:
				controller.SetNoseColor(1)
			else:
				controller.SetNoseColor(0)

	if WaitingSpeech == False and interactiveTypeGAssistant == False:  # mutex zone
		WaitingSpeech = True

		if Listening == False:
			WaitingSpeech = False
			return

		elif config["distro"] != "ibmwatson" and vc.askAboutMe(talk.strAudio):
			talk.GetResponse = False

			print("Started visual recognition")
			subprocess.call("aplay /opt/qbo/sounds/blip_0.wav", shell=True)
			
			vc.captureAndRecognizeImage(webcam)

			if vc.resultsAvailable:
				print (vc.results)
				talk.SpeechText(vc.results[0])
				vc.resultsAvailable = False

			talk.strAudio = " "
			talk.GetAudio = False
			talk.GetResponse = False

		elif talk.GetResponse == True:

			if config["distro"] != "ibmwatson":
				listen_thd(wait_for_stop=True)

			if len(talk.Response) > 0:
				talk.SpeechText(talk.Response)

			if config["distro"] != "ibmwatson":
				controller.SetNoseColor(0)

			talk.GetResponse = False
			Listening = False

			StartHotwordListener()

		WaitingSpeech = False

	return


def WaitTouchMove():
	global Xcoor, Ycoor, touch_tm, mutex_wait_touch, faceFound

	if (mutex_wait_touch):
		return

	mutex_wait_touch = True
	time.sleep(3)

	if faceFound:
		return

	controller.SetServo(1, Xcoor, int(config["servoSpeed"]))
	time.sleep(0.1)
	controller.SetServo(2, Ycoor, int(config["servoSpeed"]))
	time.sleep(1)
	touch_tm = time.time()
	mutex_wait_touch = False

	return

hotword_listener = None


def StartHotwordListener():
	global hotword_listener

	# If Google Assistant interactive mode is active, we do not start a separate hotword listener.
	if interactiveTypeGAssistant:
		return

	# Use openWakeWord-based listener.
	if hotword_listener is None:
		hotword_listener = OpenWakeWordListener(HotwordListenedEvent)
		hotword_listener.start()


def StopHotwordListener():
	global hotword_listener
	if interactiveTypeGAssistant:
		return
	if hotword_listener is not None:
		hotword_listener.stop()
		hotword_listener = None

def DialogflowV2SeeFace():
	talk.record_wav()
	talk.detect_intent_stream()

def HotwordListenedEvent():
	global HotwordListened
	HotwordListened = True

StartHotwordListener()

print(" Face tracking running.")
print(" QBO nose bright green when see your face")

Speak.SpeechText_2("I am ready.", "Estoy preparado.")

touch_tm = time.time()

fr_time = 0

while True:
	# print "frame time: " + str(time.time() - fr_time)
	fr_time = time.time()

	faceFound = False  # This variable is set to true if, on THIS loop a face has already been found
	# We search for a face three diffrent ways, and if we have found one already-
	# there is no reason to keep looking.
	_thread.start_new_thread(WaitForSpeech, ())
	#	WaitForSpeech()

	if HotwordListened:

		if Listening == False:

			if config["distro"] != "ibmwatson":
				controller.SetNoseColor(1)

			StopHotwordListener()

			if interactiveTypeGAssistant == True:
				gassistant.start_conversation_from_face()
			else:
				listen_thd = talk.StartBack()
				Listening = True

		HotwordListened = False

	if not faceFound:
		if lastface == 0 or lastface == 1:
			t_ini = time.time()

			while time.time() - t_ini < 0.01:  # wait for present frame
				t_ini = time.time()
				aframe = webcam.read()[1]

			# print "t: " + str(time.time()-t_ini)
			if frame_w > 320:
				aframe = cv2.resize(aframe, (320, 240))
			fface = frontalface.detectMultiScale(aframe, 1.3, 4, (cv2.CASCADE_DO_CANNY_PRUNING + cv2.CASCADE_FIND_BIGGEST_OBJECT + cv2.CASCADE_DO_ROUGH_SEARCH), (60, 60))

			if len(fface) > 0:  # if we found a frontal face...
				face_not_found_idx = 0
				lastface = 1  # set lastface 1 (so next loop we will only look for a frontface)
				for f in fface:  # f in fface is an array with a rectangle representing a face
					faceFound = True
					face = f

	if not faceFound:  # if we didnt find a face yet...
		if lastface == 0 or lastface == 2:  # only attempt it if we didn't find a face last loop or if-
			t_ini = time.time()

			while time.time() - t_ini < 0.01:  # wait for present frame
				t_ini = time.time()
				aframe = webcam.read()[1]

			# print "tp: " + str(time.time()-t_ini)
			if frame_w > 320:
				aframe = cv2.resize(aframe, (320, 240))
			pfacer = profileface.detectMultiScale(aframe, 1.3, 4, (cv2.CASCADE_DO_CANNY_PRUNING + cv2.CASCADE_FIND_BIGGEST_OBJECT + cv2.CASCADE_DO_ROUGH_SEARCH), (80, 80))

			if len(pfacer) > 0:  # if we found a profile face...
				face_not_found_idx = 0
				lastface = 2
				for f in pfacer:
					faceFound = True
					face = f

	if not faceFound:  # if no face was found...-

		face_not_found_idx += 1
		print("No face " + str(face_not_found_idx))

		if face_not_found_idx > 5:
			face_not_found_idx = 0
			lastface = 0  # the next loop needs to know
			face = [0, 0, 0, 0]  # so that it doesn't think the face is still where it was last loop

			if config["distro"] != "ibmwatson":
				controller.SetNoseColor(0)  # Off QBO nose brigth

			if Facedet != 0:
				Facedet = 0
				no_face_tm = time.time()
				print("No face, 5 times!")

			elif time.time() - no_face_tm > 10:
				ServoHome()
				Cface[0] = [0, 0]
				no_face_tm = time.time()

	else:

		last_face_det_tm = time.time()
		x, y, w, h = face

		Cface = [(w // 2 + x), (h // 2 + y)]  # we are given an x,y corner point and a width and height, we need the center
		#print "face ccord: " + str(Cface[0]) + "," + str(Cface[1])

		if Facedet == 0:
			if Listening == False:
				if config["distro"] != "ibmwatson":
					controller.SetNoseColor(4)

			Facedet = 1
			face_det_tm = time.time()

		elif Listening == False & WaitingSpeech == False & (time.time() - face_det_tm > 2):
			face_det_tm = time.time()

			if Listening == False:
				if config["distro"] != "ibmwatson":
					controller.SetNoseColor(1)

				StopHotwordListener()

				if interactiveTypeGAssistant == True:
					gassistant.start_conversation_from_face()
				elif interactiveTypeGAssistant == False and config["startWith"] == "interactive-dialogflow-v2":
					DialogflowV2SeeFace()
				else:
					listen_thd = talk.StartBack()
					Listening = True

		else:
			if config["distro"] != "ibmwatson":
				if Listening:
					controller.SetNoseColor(1)  # Set QBO nose blue
				else:
					controller.SetNoseColor(4)

		if touch_det == False:

			faceOffset_X = frame_cx - Cface[0]

			if (faceOffset_X > 20) | (faceOffset_X < -20):
				Xcoor = max(Xmin, min(Xmax, Xcoor + (faceOffset_X >> 1)))
				time.sleep(0.002)
				controller.SetAngle(1, Xcoor)
				# wait for move
				time.sleep(0.05)

			# print "MOVE REL X: " + str(faceOffset_X >> 1)
			faceOffset_Y = Cface[1] - frame_cy

			if (faceOffset_Y > 20) | (faceOffset_Y < -20):
				Ycoor = max(Ymin, min(Ymax, Ycoor + (faceOffset_Y >> 1)))
				time.sleep(0.002)
				controller.SetAngle(2, Ycoor)
				# wait for move
				time.sleep(0.05)

		#print "MOVE REL Y: " + str(faceOffset_Y >> 1)

	if (time.time() - touch_samp > 0.5):  # & (time.time() - last_face_det_tm > 3):
		touch_samp = time.time()
		last_face_det_tm = time.time()
		#print "(getHeadCmd()"
		qbo_touch = controller.GetHeadCmd("GET_TOUCH", 0)
		time.sleep(0.002)

		if touch_tm == 0 and qbo_touch:

			if qbo_touch == [1]:
				controller.SetServo(1, Xmax - 25, int(config["servoSpeed"]))
				time.sleep(0.002)
				controller.SetServo(2, Ymin - 5, int(config["servoSpeed"]))
				_thread.start_new_thread(WaitTouchMove, ())
				# wait for begin touch move.
				time.sleep(1)

			elif qbo_touch == [2]:
				time.sleep(0.002)
				controller.SetServo(2, Ymin - 5, int(config["servoSpeed"]))
				_thread.start_new_thread(WaitTouchMove, ())
				# wait for begin touch move.
				time.sleep(1)

			elif qbo_touch == [3]:
				controller.SetServo(1, Xmin + 25, int(config["servoSpeed"]))
				time.sleep(0.002)
				controller.SetServo(2, Ymin - 5, int(config["servoSpeed"]))
				_thread.start_new_thread(WaitTouchMove, ())
				# wait for begin touch move.
				time.sleep(1)

	if touch_tm != 0 and time.time() - touch_tm > touch_wait:
		print("touch ready")
		touch_tm = 0


StopHotwordListener()
