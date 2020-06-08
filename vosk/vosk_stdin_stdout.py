#!/usr/bin/env python3

from vosk import Model, KaldiRecognizer, SetLogLevel
import os
import sys
import time

SetLogLevel(-1)

if len(sys.argv) < 2 or not os.path.exists(sys.argv[1]):
    exit(1)

sample_rate = sys.argv[2] if len(sys.argv) > 3 else 16000

model = Model(sys.argv[1])
rec = KaldiRecognizer(model, sample_rate)

while True:
    data = sys.stdin.buffer.read()
    if len(data) > 0:
        rec.AcceptWaveform(data)
    else:
        break

print(rec.FinalResult())
