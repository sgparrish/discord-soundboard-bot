import os
import sys
import time
import socketserver
import subprocess

from vosk import Model, KaldiRecognizer, SetLogLevel


class VoskTCPServer(socketserver.StreamRequestHandler):
    def handle(self):
        if self.client_address[0] != "127.0.0.1":
          self.request.close()
          return
        
        message = self.rfile.readline().decode("utf-8").replace("\n", "")
        if message == "die":
          os._exit(0)
        elif message == "beep":
          self.request.sendall(str.encode("boop\n"))
        else:
          if not os.path.exists(message):
            self.request.sendall(str.encode("fail"))
          rec = KaldiRecognizer(self.server.model, 16000)
          proc = subprocess.run([self.server.ffmpeg, "-f", "mp3", "-i", message, "-f", "s16le", "-ac", "1", "-ar", "16000", "pipe:1"], stdout=subprocess.PIPE)
          rec.AcceptWaveform(proc.stdout)
          self.request.sendall(str.encode(rec.FinalResult()))
          self.request.close()


if __name__ == "__main__":
    SetLogLevel(-1)

    HOST, PORT = "localhost", 9999
    if len(sys.argv) < 3:
      print(sys.argv[0] + " <model dir> <ffmpeg path>")
      sys.exit(-1)
    model = Model(sys.argv[1])
    ffmpeg = sys.argv[2]

    # Create the server, binding to localhost on port 9999
    with socketserver.ThreadingTCPServer((HOST, PORT), VoskTCPServer) as server:
        # Activate the server; this will keep running until you
        # interrupt the program with Ctrl-C
        server.model = model
        server.ffmpeg = ffmpeg
        server.serve_forever()