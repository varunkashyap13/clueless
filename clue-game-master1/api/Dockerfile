FROM node:12-alpine
ENV PORT=12000

WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
# Copy source
COPY src /usr/src/app/src

EXPOSE $PORT
CMD [ "npm", "start" ]
