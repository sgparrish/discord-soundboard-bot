# discord-soundboard-bot
## TODO: update this readme, it's currently lying

## About
This is a silly discord bot I made for my discord server. It allows you to upload sounds as you please and play them back into discord via a web interface.

The bot will also record every thing spoken in whatever channel it is in (provided discord.js hasn't broken that feature again). The recorded audio gets saved to a configured directory as well as a flat file "database". This audio is also run through speech to text software [vosk](https://github.com/alphacep/vosk-api).

![Play interface](/github/play-interface.png)

The recorded audio can then be clipped into sounds for the soundboard via another web interface.

![Clip interface](/github/clip-interface.png)

## Setup
1. Have a machine you'll run this on.
2. Install [node.js](https://nodejs.org/), [python3](https://www.python.org/)
3. Install vosk by running `pip install vosk`
4. Download a vosk model from [this page](https://alphacephei.com/vosk/models.html) and unpack into `vosk/model`
5. Create a new discord bot account [here](https://discord.com/developers/applications), add your bot to your discord server
6. Copy `.env.sample` to `.env`
7. Configure the `.env` settings file
8. Run `yarn` and `yarn start` in the project root directory
9. Open a browser to http://\<your machine>:\<port in env file>
