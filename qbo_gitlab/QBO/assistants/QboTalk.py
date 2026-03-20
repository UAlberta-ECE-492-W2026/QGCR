#!/usr/bin/env python3

import apiai
import json
import os
try:
	import speech_recognition as sr  # type: ignore[import-not-found]
except ImportError:
	# The robot depends on this at runtime; if it's missing we avoid crashing
	# at import-time so other modes/tools can still run.
	sr = None
import subprocess
import wave
import yaml


class QBOtalk(object):

	def __init__(self):
		# Always define attributes up-front so later code can't fail with
		# AttributeError even if initialization steps raise/short-circuit.
		self.m = None

		self.config = yaml.safe_load(open("/opt/qbo/config.yml"))
		self.r = sr.Recognizer() if sr is not None else None
		self.ai = apiai.ApiAI(self.config["tokenAPIai"]) if sr is not None else None
		self.Response = "hello"
		self.GetResponse = False
		self.GetAudio = False
		self.strAudio = ""

		if sr is None:
			print("Warning: 'speech_recognition' module not installed; speech capture disabled.")
			return

		# Try to find the QBO microphone by name. Accept any of the known
		# device names used across different QBO hardware revisions.
		QBO_MIC_NAMES = ("dmicQBO_sv", "googlevoicehat", "voicehat")
		mic_index = None
		for i, mic_name in enumerate(sr.Microphone.list_microphone_names()):
			if any(known in mic_name.lower() for known in QBO_MIC_NAMES):
				mic_index = i
				break

		try:
			if mic_index is not None:
				self.m = sr.Microphone(device_index=mic_index)
			else:
				# Fallback: use the default microphone so the code still works
				# on systems where the original QBO mic name is not present.
				print("Warning: QBO microphone not found by name. Using default microphone.")
				self.m = sr.Microphone()
		except OSError as e:
			# No usable microphone found – log and leave self.m as None so callers can handle it.
			print("Error initializing microphone for QBOtalk:", e)
			self.m = None

		if self.m is not None:
			with self.m as source:
				self.r.adjust_for_ambient_noise(source)

	def Decode(self, audio):
		try:
			if self.config["language"] == "spanish":
				str = self.r.recognize_google(audio, language="es-ES")
			else:
				str = self.r.recognize_google(audio)

			self.strAudio = str
			self.GetAudio = True

			print("listen: " + self.strAudio)

			request = self.ai.text_request()
			request.query = str
			response = request.getresponse()
			data = json.loads(response.read())
			str_resp = data["result"]["fulfillment"]["speech"]

		except sr.UnknownValueError:
			str_resp = ""

		except sr.RequestError as e:
			str_resp = "Could not request results from Speech Recognition service"

		return str_resp

	def downsampleWav(self, src):
		print("src: " + src)
		s_read = wave.open(src, 'r')
		print("frameRate: " + str(s_read.getframerate()))
		s_read.setframerate(16000)
		print("frameRate_2: " + str(s_read.getframerate()))
		return

	def downsampleWave_2(self, src, dst, inrate, outrate, inchannels, outchannels):

		if not os.path.exists(src):
			print('Source not found!')
			return False

		if not os.path.exists(os.path.dirname(dst)):
			print("dst: " + dst)
			print("path: " + os.path.dirname(dst))
			os.makedirs(os.path.dirname(dst))

		try:
			s_read = wave.open(src, 'r')
			s_write = wave.open(dst, 'w')

		except:
			print('Failed to open files!')
			return False

		n_frames = s_read.getnframes()
		data = s_read.readframes(n_frames)

		try:
			converted = audioop.ratecv(data, 2, inchannels, inrate, outrate, None)
			if outchannels == 1:
				converted = audioop.tomono(converted[0], 2, 1, 0)

		except:
			print('Failed to downsample wav')
			return False

		try:
			s_write.setparams((outchannels, 2, outrate, 0, 'NONE', 'Uncompressed'))
			s_write.writeframes(converted)

		except:
			print('Failed to write wav')
			return False

		try:
			s_read.close()
			s_write.close()

		except:
			print('Failed to close wav files')
			return False

		return True

	def _play_pico2wave(self, text, lang):
		"""
		Play TTS from pico2wave on Google Voice HAT / Pi 5.

		Pi 3 often used a custom ALSA PCM 'convertQBO'. On Pi 5, forcing S32/48k
		in asound.conf or in a 32-bit WAV file often sounds wrong; letting ALSA
		negotiate via plughw usually matches what worked before.

		config.yml (all optional):
		  audioPlaybackDevice: "plughw:0,0"   # default; use card index if not 0
		  audioPlaybackMode: "plughw"        # plughw | raw48 | convertQBO
		"""
		vol = self.config["volume"]
		wav = "/opt/qbo/sounds/pico2wave.wav"
		mode = str(self.config.get("audioPlaybackMode", "plughw")).lower()
		device = self.config.get("audioPlaybackDevice")
		if device is None:
			device = "convertQBO" if mode == "convertqbo" else "plughw:0,0"

		gen = (
			'pico2wave -l "{lang}" -w {wav} "<volume level=\'{vol}\'>{text}"'
		).format(lang=lang, wav=wav, vol=vol, text=text)

		if mode == "raw48":
			# No WAV header mismatch: sox writes raw S32 48k stereo, aplay reads raw.
			hw = self.config.get("audioPlaybackHwDevice", "hw:0,0")
			cmd = (
				"{gen} && sox {wav} -t raw -r 48000 -e signed-integer -b 32 -c 2 - "
				"| aplay -D {hw} -t raw -f S32_LE -r 48000 -c 2"
			).format(gen=gen, wav=wav, hw=hw)
		else:
			# plughw or convertQBO: play the 16 kHz mono WAV; ALSA converts.
			cmd = "{gen} && aplay -D {dev} {wav}".format(gen=gen, dev=device, wav=wav)

		subprocess.call(cmd, shell=True)

	def SpeechText(self, text_to_speech):
		lang = "es-ES" if self.config["language"] == "spanish" else "en-US"
		self._play_pico2wave(text_to_speech, lang)

	def SpeechText_2(self, text_to_speech, text_spain):
		if self.config["language"] == "spanish":
			self._play_pico2wave(text_spain, "es-ES")
		else:
			self._play_pico2wave(text_to_speech, "en-US")

	def callback(self, recognizer, audio):
		try:
			self.Response = self.Decode(audio)
			self.GetResponse = True
			print("Google say ")

		except:
			return

	def callback_listen(self, recognizer, audio):
		print("callback listen")
		try:
			if self.config["language"] == "spanish":
				self.strAudio = self.r.recognize_google(audio, language="es-ES")
			else:
				self.strAudio = self.r.recognize_google(audio)

			self.GetAudio = True

			print("listen: " + self.strAudio)


		except:
			print("callback listen exception")
			self.strAudio = ""
			return

	def Start(self):

		print("Say something!")
		self.r.operation_timeout = 10

		if self.m is None:
			print("Warning: microphone not initialized; cannot start speech capture.")
			return
		if self.r is None:
			print("Warning: speech recognizer not available.")
			return

		with self.m as source:
			audio = self.r.listen(source=source, timeout=2)

		response = self.Decode(audio)
		self.SpeechText(response)

	def StartBack(self):
		if self.m is None:
			print("Warning: microphone not initialized; cannot start background listening.")
			return None
		if self.r is None:
			print("Warning: speech recognizer not available.")
			return None

		with self.m as source:
			self.r.adjust_for_ambient_noise(source)

		print("start background listening")

		return self.r.listen_in_background(self.m, self.callback)

	def StartBackListen(self):
		if self.m is None:
			print("Warning: microphone not initialized; cannot start background listening (listen-only).")
			return None
		if self.r is None:
			print("Warning: speech recognizer not available.")
			return None

		with self.m as source:
			self.r.adjust_for_ambient_noise(source)

		print("start background only listening")

		return self.r.listen_in_background(self.m, self.callback_listen)
