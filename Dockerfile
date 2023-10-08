FROM node:18

# Get log rotate
RUN apt-get update
RUN apt-get -y install logrotate

# Auto vosk setup (does this count as redistribution?)
ARG VOSK_MODEL_URL="https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip"

# Start seting up soundboard
WORKDIR /usr/src/app
VOLUME ["/usr/src/app/data"]

# Download npm dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn

# Copy in source and build
COPY . .
RUN yarn build

# Setup services
COPY docker/logrotate.d/soundboard /etc/logrotate.d
COPY --chmod=700 docker/setupvosk.sh .
RUN ./docker/setupvosk.sh

EXPOSE 8080
CMD [ "node", "src/server/index.js" ]