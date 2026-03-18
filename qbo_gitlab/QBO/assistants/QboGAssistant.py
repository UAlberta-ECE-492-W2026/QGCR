#!/usr/bin/env python3

import os
import json
import subprocess
import threading
import google.auth.transport.requests
import google.oauth2.credentials
from google.assistant.embedded.v1alpha2 import embedded_assistant_pb2_grpc
from google.assistant.embedded.v1alpha2 import embedded_assistant_pb2
import grpc

# Note: We now use the gRPC assistant, not the Library 'Assistant'
class GAssistant(object):
    onConversation = False
    doBlip = True

    def __init__(self, device_model_id, credentials_file='/opt/qbo/.config/google-oauthlib-tool/credentials.json'):
        # Load credentials properly for gRPC
        with open(credentials_file, 'r') as f:
            creds_data = json.load(f)
            self.credentials = google.oauth2.credentials.Credentials(
                token=None, 
                refresh_token=creds_data.get('refresh_token'),
                token_uri=creds_data.get('token_uri'),
                client_id=creds_data.get('client_id'),
                client_secret=creds_data.get('client_secret')
            )
        
        self.device_model_id = device_model_id
        self.device_id = "qbo_robot_device" # Can be any unique string
        
        # Initialize gRPC channel
        self.channel = grpc.secure_channel(
            'embeddedassistant.googleapis.com',
            grpc.ssl_channel_credentials()
        )
        
        self.assistant = embedded_assistant_pb2_grpc.EmbeddedAssistantStub(self.channel)
        self.thread = threading.Thread(target=self.run)
        self.thread.daemon = True

    def run(self):
        # The gRPC version works by sending/receiving audio streams
        # For a full "OK Google" replacement, you would integrate 
        # the Porcupine wake-word engine right here.
        print("Assistant gRPC initialized.")

    def start_conversation(self):
        """Triggers the assistant to start listening."""
        if not self.onConversation:
            print("Starting conversation...")
            if self.doBlip:
                subprocess.call("aplay /opt/qbo/sounds/blip_0.wav", shell=True)
            # Logic to stream audio to Google goes here
