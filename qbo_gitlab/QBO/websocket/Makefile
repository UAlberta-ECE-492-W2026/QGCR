.PHONY:clean

all:WebsocketServer

WebsocketServer:WebsocketServer.c
	gcc WebsocketServer.c -o WebsocketServer -lwebsockets -lpthread

clean:
	-rm WebsocketServer
