# TODO
1. ~~Add temporary configs~~
2. ~~Switch to pino logging~~
3. Containerize?
4. Expand admin panel
   1. Select which server bot operates on
   2. Select which channels bot operates in
   3. Configure which channel is clips playback / recordings log / admin panel (?)
   4. Recording configs
      1. Configure who bot will record
      2. Enable / disable SST
      3. Auto download SST model
      4. Enable / disable consent
      5. Configure what to do if consent isn't given
      6. Configure how long recordings are kept
      7. Configure who can delete recordings
      8. Configure if bot deletes discord messages
   5. Clip configs
      1. Configure who can play sounds
      2. Configure who can make clips
      3. Configure who can upload clips
5. Make stats page
   1. Time speaking
   2. Time connected
   3. Gamerwords said
6. Generate SST training sets?



```
Error [ERR_STREAM_PUSH_AFTER_EOF]: stream.push() after EOF
    at new NodeError (node:internal/errors:405:5)
    at readableAddChunk (node:internal/streams/readable:296:30)
    at Readable.push (node:internal/streams/readable:245:10)
    at AudioReceiveStream.push (/usr/src/app/node_modules/@discordjs/voice/dist/index.js:1359:18)
    at VoiceReceiver.onUdpMessage (/usr/src/app/node_modules/@discordjs/voice/dist/index.js:1595:16)
    at VoiceUDPSocket.emit (node:events:517:28)
    at VoiceUDPSocket.onMessage (/usr/src/app/node_modules/@discordjs/voice/dist/index.js:315:10)
    at Socket.<anonymous> (/usr/src/app/node_modules/@discordjs/voice/dist/index.js:302:48)
    at Socket.emit (node:events:517:28)
    at UDP.onMessage [as onmessage] (node:dgram:942:8)
Emitted 'error' event on AudioReceiveStream instance at:
    at emitErrorNT (node:internal/streams/destroy:151:8)
    at emitErrorCloseNT (node:internal/streams/destroy:116:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'ERR_STREAM_PUSH_AFTER_EOF'
```