#!/usr/bin/env python3

import subprocess
import wave
import pyaudio
import tempfile
import yaml
import threading
import time

from watson_developer_cloud import SpeechToTextV1
from watson_developer_cloud import TextToSpeechV1
from watson_developer_cloud import AssistantV2

from VisualRecognition import VisualRecognition


class QBOWatson(object):

	def __init__(self):
		self.config = yaml.safe_load(open("/opt/qbo/config.yml"))
		self.strAudio = ""
		self.GetAudio = False
		self.Response = "hello"
		self.GetResponse = False
		self.webcam = None

		self.onListening = False
		self.onListeningChanged = True
		self.finishThread = False

		self.FORMAT = pyaudio.paInt16
		self.CHANNELS = 1
		self.RATE = 16000
		self.CHUNK = 1024
		self.RECORD_SECONDS = self.config['SpeechToTextListeningTime']

		self.text_to_speech = TextToSpeechV1(
			iam_apikey=self.config['TextToSpeechAPIKey'],
			url=self.config['TextToSpeechURL'])
		self.text_to_speech.disable_SSL_verification()

		self.speech_to_text = SpeechToTextV1(
			iam_apikey=self.config['SpeechToTextAPIKey'],
			url=self.config['SpeechToTextURL'])
		self.speech_to_text.disable_SSL_verification()

		self.assistant = AssistantV2(
			iam_apikey=self.config['AssistantAPIKey'],
			url=self.config['AssistantURL'],
			version='2018-09-20')
		self.assistant.disable_SSL_verification()

		self.assistantID = self.config['AssistantID']
		self.sessionID = ""

		self.vc = VisualRecognition()

		# Create thread
		self.thread = threading.Thread(target=self.threadWorker, args=())
		self.thread.daemon = False

	def setWebcam(self, webcam):
		self.webcam = webcam

	def startThread(self):

		self.finishThread = False
		self.thread.start()

	def threadWorker(self):
		while True:

			if self.onListening:

				audio = pyaudio.PyAudio()
				stream = audio.open(format=self.FORMAT, channels=self.CHANNELS, rate=self.RATE, input=True, frames_per_buffer=self.CHUNK)

				print("recording...")
				frames = []
				for i in range(0, int(self.RATE / self.CHUNK * self.RECORD_SECONDS)):
					data = stream.read(self.CHUNK)
					frames.append(data)
				print("finished recording")

				# stop Recording
				stream.stop_stream()
				stream.close()
				audio.terminate()

				# Create wav file
				tmp = tempfile.NamedTemporaryFile()
				waveFile = wave.open(tmp, 'wb')
				waveFile.setnchannels(self.CHANNELS)
				waveFile.setsampwidth(audio.get_sample_size(self.FORMAT))
				waveFile.setframerate(self.RATE)
				waveFile.writeframes(b''.join(frames))
				waveFile.close()

				model = 'en-US_BroadbandModel'
				if self.config['language'] == 'spanish':
					model = 'es-ES_BroadbandModel'

				try:
					with open(tmp.name) as audio_file:
						results = self.speech_to_text.recognize(audio=audio_file, content_type='audio/wav', model=model).get_result()
						if len(results['results']) != 0 and len(results['results'][0]['alternatives']) != 0:
							self.strAudio = results['results'][0]['alternatives'][0]['transcript']
						else:
							self.strAudio = " "
						self.GetAudio = True
				except:
					print("WATSON RECOGNIZE ERROR")
					self.strAudio = " "
					self.GetAudio = True

				self.onListening = False
				self.onListeningChanged = True

				if len(self.strAudio) > 1:
					if self.vc.askAboutMe(self.strAudio):
						self.GetResponse = False

						print("Started visual recognition")
						subprocess.call("aplay /opt/qbo/sounds/blip_0.wav", shell=True)

						self.vc.captureAndRecognizeImageWatson(self.webcam)

						if self.vc.resultsAvailable:
							print (self.vc.results)
							self.SpeechText(self.vc.results[0])
							self.vc.resultsAvailable = False

						self.strAudio = " "
						self.GetAudio = False
						self.GetResponse = True
						self.Response = ""

					else:
						self.askToAssistant(self.strAudio)
				else:
					self.GetResponse = True
					self.Response = ""

			if self.finishThread:
				exit(1)

			time.sleep(1)

	def stopThread(self):
		self.finishThread = True

	def askToAssistant(self, text):

		print("Understood message: %s" % text)

		try:
			session = self.assistant.create_session(self.assistantID).get_result()
			self.sessionID = session['session_id']

			message = self.assistant.message(self.assistantID, self.sessionID, input={'text': text}).get_result()

			self.Response = message['output']['generic'][0]['text']
			self.GetResponse = True

			print("Watson Assistant Response: %s" % self.Response)

			self.assistant.delete_session(self.assistantID, self.sessionID).get_result()

			return self.Response
		except:
			print("WATSON ASK TO ASSISTANT ERROR")
			self.Response = ""
			self.GetResponse = False

	def StartBack(self):
		self.onListening = True
		self.onListeningChanged = True
		return 0

	def SpeechText(self, text):

		voice = 'en-US_MichaelVoice'
		if self.config['language'] == 'spanish':
			voice = 'es-ES_EnriqueVoice'

		try:
			with open('/opt/qbo/sounds/watson.wav', 'wb') as audio_file:
				audio_file.write(self.text_to_speech.synthesize(text, accept='audio/wav', voice=voice).get_result().content)

			subprocess.call('aplay -D convertQBO /opt/qbo/sounds/watson.wav', shell=True)
		except:
			print("WATSON SPEAK ERROR")
