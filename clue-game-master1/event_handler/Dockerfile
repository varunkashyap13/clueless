FROM node:12-alpine

WORKDIR /usr/src/app/

COPY package.json /usr/src/app/
RUN npm install
RUN npm install -g npm-run-all

COPY common /usr/src/app/common

# Copy source
COPY src /usr/src/app/src

CMD [ "npm", "start" ]