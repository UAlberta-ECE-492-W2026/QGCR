#!/usr/bin/env python2
# -*- coding: latin-1 -*-

import sys
import yaml
import subprocess

# read config file
config = yaml.safe_load(open("/opt/qbo/config.yml"))


def SpeechText_2(text_english, text_spain, forceStandalone=False):
    global config

    if config['distro'] == 'ibmwatson' and not forceStandalone:
        from watson_developer_cloud import TextToSpeechV1

        text_to_speech = TextToSpeechV1(
            iam_apikey=config['TextToSpeechAPIKey'],
            url=config['TextToSpeechURL'])
        text_to_speech.disable_SSL_verification()

        voice = 'en-US_MichaelVoice'
        text = text_english
        if config['language'] == 'spanish':
            voice = 'es-ES_EnriqueVoice'
            text = text_spain

        try:
            with open('/opt/qbo/sounds/watson.wav', 'wb') as audio_file:
                audio_file.write(text_to_speech.synthesize(text, accept='audio/wav', voice=voice).get_result().content)

            subprocess.call('aplay -D convertQBO /opt/qbo/sounds/watson.wav', shell=True)
        except:
            print("WATSON ERROR: USING STANDALONE")

            lang_code = 'en-US'
            text = "It is not possible to establish a connection with Watson. Watson services are disabled. Try restarting QBO and make sure you have an Internet connection."
            if config['language'] == 'spanish':
                lang_code = 'es-ES'
                text = "No es posible establecer conexion con Watson. Los servicios de Watson estan deshabilitados. Pruebe reiniciar QBO y asegurese de tener conexion a Internet."

            speak = 'pico2wave -l "{}" -w /opt/qbo/sounds/pico2wave.wav "<volume level=\'{}\'>{}" && aplay -D convertQBO /opt/qbo/sounds/pico2wave.wav'.format(
                lang_code, config['volume'], text)

            subprocess.call(speak, shell=True)

    else:

        lang_code = 'en-US'
        text = text_english
        if config['language'] == 'spanish':
            lang_code = 'es-ES'
            text = text_spain

        speak = 'pico2wave -l "{}" -w /opt/qbo/sounds/pico2wave.wav "<volume level=\'{}\'>{}" && aplay -D convertQBO /opt/qbo/sounds/pico2wave.wav'.format(lang_code, config['volume'], text)

        subprocess.call(speak, shell=True)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
    else:
        action = "default"

    if action == "custom":
        custom = sys.argv[2]
        SpeechText_2(custom, custom)

    elif action == "update":
        SpeechText_2("Update completed. Wait while I restart.",
                     "El sistema se ha actualizado correctamente. Espera mientras reinicio.")

    else:
        SpeechText_2("Hi. I am Cubo",
                     "Hola. Soy Cubo")
