#!/usr/bin/env python2
# -*- coding: latin-1 -*-

from __future__ import print_function
import os
import time
import yaml
import sys


class VisualRecognition:

	def __init__(self, debug=False, tmp_file='/tmp/VisualRecognitionCapture.png', tfvrmodel='/opt/qbo/tfvrmodel'):

		self.config = yaml.safe_load(open("/opt/qbo/config.yml"))
		self.debug = debug
		self.tmp_file = tmp_file
		self.tfvrmodel = tfvrmodel
		self.results = []
		self.resultsAvailable = False


	def askAboutMe(self, text):

		if self.config['language'] == 'spanish':
			texts = ["mira esto", "observa esto", "reconocimiento visual", "inicia reconocimiento visual", "que ves", "que tengo aqui"]
		else:
			texts = ["watch this", "visual recognition", "start visual recognition", "look this", "what is this"]

		for t in texts:
			if text.find(t) != -1:
				return True
		return False

	def captureAndRecognizeImage(self, webcam=None):
		self.captureImage(webcam)
		self.recognizeImage()

	def captureAndRecognizeImageWatson(self,webcam=None):
		self.captureImage(webcam)
		if self.config['distro'] == 'ibmwatson':
			try:
				if len(self.config['VisualRecognitionAPIKey']) > 2:
					self.recognizeImageWithIBM()
				else:
					pass
			except KeyError:
				pass
		else:
			pass

	def captureImage(self, webcam=None):

		import cv2
		webcamByArg=True

		if webcam is None:
			webcamByArg = False
			webcam = cv2.VideoCapture(int(self.config['camera']))  # Select camera

		return_value, image = webcam.read()
		cv2.imwrite(self.tmp_file, image)
		del return_value, image

		if webcamByArg is False:
			webcam.release()

	def recognizeImage(self):
		if self.config['distro'] == 'ibmwatson':
			try:
				if len(self.config['VisualRecognitionAPIKey']) > 2:
					self.recognizeImageWithIBM()
				else:
					self.recognizeImageWithTensorFlow()
			except KeyError:
				self.recognizeImageWithTensorFlow()
		else:
			self.recognizeImageWithTensorFlow()

	def recognizeImageWithTensorFlow(self, num_top_predictions=5):

		self.resultsAvailable = False

		import re
		import numpy as np
		import tensorflow as tf

		model_dir = self.tfvrmodel

		class NodeLookup(object):
			"""Converts integer node ID's to human readable labels."""

			def __init__(self,
						 label_lookup_path=None,
						 uid_lookup_path=None):
				if not label_lookup_path:
					label_lookup_path = os.path.join(
						model_dir, 'imagenet_2012_challenge_label_map_proto.pbtxt')
				if not uid_lookup_path:
					uid_lookup_path = os.path.join(
						model_dir, 'imagenet_synset_to_human_label_map.txt')
				self.node_lookup = self.load(label_lookup_path, uid_lookup_path)

			def load(self, label_lookup_path, uid_lookup_path):
				if not tf.gfile.Exists(uid_lookup_path):
					tf.logging.fatal('File does not exist %s', uid_lookup_path)
				if not tf.gfile.Exists(label_lookup_path):
					tf.logging.fatal('File does not exist %s', label_lookup_path)

				# Loads mapping from string UID to human-readable string
				proto_as_ascii_lines = tf.gfile.GFile(uid_lookup_path).readlines()
				uid_to_human = {}
				p = re.compile(r'[n\d]*[ \S,]*')
				for line in proto_as_ascii_lines:
					parsed_items = p.findall(line)
					uid = parsed_items[0]
					human_string = parsed_items[2]
					uid_to_human[uid] = human_string

				# Loads mapping from string UID to integer node ID.
				node_id_to_uid = {}
				proto_as_ascii = tf.gfile.GFile(label_lookup_path).readlines()
				for line in proto_as_ascii:
					if line.startswith('  target_class:'):
						target_class = int(line.split(': ')[1])
					if line.startswith('  target_class_string:'):
						target_class_string = line.split(': ')[1]
						node_id_to_uid[target_class] = target_class_string[1:-2]

				# Loads the final mapping of integer node ID to human-readable string
				node_id_to_name = {}
				for key, val in node_id_to_uid.items():
					if val not in uid_to_human:
						tf.logging.fatal('Failed to locate: %s', val)
					name = uid_to_human[val]
					node_id_to_name[key] = name

				return node_id_to_name

			def id_to_string(self, node_id):
				if node_id not in self.node_lookup:
					return ''
				return self.node_lookup[node_id]

		def create_graph():
			with tf.gfile.FastGFile(os.path.join(model_dir, 'classify_image_graph_def.pb'), 'rb') as f:
				graph_def = tf.GraphDef()
				graph_def.ParseFromString(f.read())
				_ = tf.import_graph_def(graph_def, name='')


		if not tf.gfile.Exists(self.tmp_file):
			tf.logging.fatal('File does not exist %s', self.tmp_file)
		image_data = tf.gfile.FastGFile(self.tmp_file, 'rb').read()

		# Creates graph from saved GraphDef.
		create_graph()

		with tf.Session() as sess:
			# Some useful tensors:
			# 'softmax:0': A tensor containing the normalized prediction across
			#   1000 labels.
			# 'pool_3:0': A tensor containing the next-to-last layer containing 2048
			#   float description of the image.
			# 'DecodeJpeg/contents:0': A tensor containing a string providing JPEG
			#   encoding of the image.
			# Runs the softmax tensor by feeding the image_data as input to the graph.
			softmax_tensor = sess.graph.get_tensor_by_name('softmax:0')
			predictions = sess.run(softmax_tensor, {'DecodeJpeg/contents:0': image_data})
			predictions = np.squeeze(predictions)

			# Creates node ID --> English string lookup.
			node_lookup = NodeLookup()

			self.results = []
			top_k = predictions.argsort()[-num_top_predictions:][::-1]

			for node_id in top_k:
				human_string = node_lookup.id_to_string(node_id)
				score = predictions[node_id]
				if self.debug:
					print('%s (score = %.5f)' % (human_string, score))
				self.results.append(human_string)

			self.resultsAvailable = True

	def recognizeImageWithIBM(self):

		self.resultsAvailable = False

		try:
			if len(self.config['VisualRecognitionAPIKey']) <= 2:
				print("It is necessary to specify API Key to use the IBM Watson recognition")
				return
		except KeyError:
			return

		from watson_developer_cloud import VisualRecognitionV3

		visual_recognition = VisualRecognitionV3(
			'2018-03-19',
			url=self.config['VisualRecognitionURL'],
			iam_apikey=self.config['VisualRecognitionAPIKey'])

		lang = 'en'
		if self.config["language"] == "spanish":
			lang = 'es'

		with open(self.tmp_file, 'rb') as image_file:
			text_results = visual_recognition.classify(images_file=image_file, accept_language=lang).get_result()

			try:
				items = text_results['images'][0]['classifiers'][0]['classes']

				self.results = []
				for item in items:
					if self.debug:
						print('%s (score = %.5f)' % (item['class'], item['score']))
					self.results.append(item['class'])

				self.resultsAvailable = True

			except NameError:
				self.results = []
				self.resultsAvailable = False
			except TypeError:
				self.results = []
				self.resultsAvailable = False
			except KeyError:
				self.results = []
				self.resultsAvailable = False


if __name__ == '__main__':

	vc = VisualRecognition(True)

	while True:
		raw_input('Press Enter to capture or CTRL+C to close.')

		print("Photo in ", end="")

		for i in [3, 2, 1]:
			print(i, end=" ")
			sys.stdout.flush()
			time.sleep(1)

		vc.captureImage()

		print("TAKEN!")

		print("\nIBM Watson Visual Recognition Response:")

		vc.recognizeImageWithIBM()

		print("\nTensorflow Visual Recognition Response:")
		vc.recognizeImageWithTensorFlow()

		print("\n")
