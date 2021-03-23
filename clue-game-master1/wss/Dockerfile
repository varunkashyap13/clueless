FROM node:12-alpine

ENV PORT=13000

WORKDIR /usr/src/app/

COPY package.json /usr/src/app/
RUN npm install
RUN npm install -g npm-run-all
COPY common /usr/src/app/common

# Copy source
COPY src /usr/src/app/src

EXPOSE $PORT
CMD [ "npm", "start" ]
