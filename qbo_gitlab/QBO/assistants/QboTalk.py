#!/usr/bin/env python3

import apiai
import json
import os
import speech_recognition as sr
import subprocess
import wave
import yaml


class QBOtalk(object):

	def __init__(self):

		self.config = yaml.safe_load(open("/opt/qbo/config.yml"))
		self.r = sr.Recognizer()
		self.ai = apiai.ApiAI(self.config["tokenAPIai"])
		self.Response = "hello"
		self.GetResponse = False
		self.GetAudio = False
		self.strAudio = ""

		for i, mic_name in enumerate(sr.Microphone.list_microphone_names()):
			if mic_name == "dmicQBO_sv":
				self.m = sr.Microphone(i)

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

	def SpeechText(self, text_to_speech):

		if self.config["language"] == "spanish":
			speak = "pico2wave -l \"es-ES\" -w /opt/qbo/sounds/pico2wave.wav \"<volume level='" + str(self.config["volume"]) + "'>" + text_to_speech + "\" && aplay -D convertQBO /opt/qbo/sounds/pico2wave.wav"
		else:
			speak = "pico2wave -l \"en-US\" -w /opt/qbo/sounds/pico2wave.wav \"<volume level='" + str(self.config["volume"]) + "'>" + text_to_speech + "\" && aplay -D convertQBO /opt/qbo/sounds/pico2wave.wav"
		subprocess.call(speak, shell=True)

	def SpeechText_2(self, text_to_speech, text_spain):
		if self.config["language"] == "spanish":
			speak = "pico2wave -l \"es-ES\" -w /opt/qbo/sounds/pico2wave.wav \"<volume level='" + str(self.config["volume"]) + "'>" + text_spain + "\" && aplay -D convertQBO /opt/qbo/sounds/pico2wave.wav"
		else:
			speak = "pico2wave -l \"en-US\" -w /opt/qbo/sounds/pico2wave.wav \"<volume level='" + str(self.config["volume"]) + "'>" + text_to_speech + "\" && aplay -D convertQBO /opt/qbo/sounds/pico2wave.wav"
		subprocess.call(speak, shell=True)

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

		with self.m as source:
			audio = self.r.listen(source=source, timeout=2)

		response = self.Decode(audio)
		self.SpeechText(response)

	def StartBack(self):
		with self.m as source:
			self.r.adjust_for_ambient_noise(source)

		print("start background listening")

		return self.r.listen_in_background(self.m, self.callback)

	def StartBackListen(self):
		with self.m as source:
			self.r.adjust_for_ambient_noise(source)

		print("start background only listening")

		return self.r.listen_in_background(self.m, self.callback_listen)
