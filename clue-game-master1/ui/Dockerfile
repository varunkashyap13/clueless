FROM node:12-alpine

ENV PORT=14000

WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
RUN npm install -g concurrently

# Copy source
COPY src/server.js /usr/src/app/src/
COPY public /usr/src/app/public/

EXPOSE $PORT
CMD npm start
