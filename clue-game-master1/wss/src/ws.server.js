const PORT = 13000;
const io = require('socket.io')(PORT, { cookie: false, sameSite: "none" });
const pubsub = require('../common/redis/pubsub');
const logger = require('../common/logging/logger');
const inboundQueue = 'events:inbound';
const outboundQueue = 'events:outbound';

// Handle new client connections and publish the clients events to the Queue
io.on('connection', function (client) {
    console.log('Client Connected ', client.id)
    client.emit('joinStatus', { "connStatus": "You are now connected to the Remote Server" })

    client.on('joinGame', (event) => {
        pubsub.pub(inboundQueue, JSON.stringify(event));
    });
    client.on('createGame', (event) => {
        pubsub.pub(inboundQueue, JSON.stringify(event));
    });
    client.on('chooseCharacter', (event) => {
        pubsub.pub(inboundQueue, JSON.stringify(event)); 
    });
    client.on('readyToPlay', (event) => {
        pubsub.pub(inboundQueue, JSON.stringify(event)); 
    });
    client.on('move', (event) => {
        pubsub.pub(outboundQueue, JSON.stringify(event));
        pubsub.pub(inboundQueue, JSON.stringify(event)); 
    });
    client.on('suggestion', (event) => {
        pubsub.pub(outboundQueue, JSON.stringify(event));
        pubsub.pub(inboundQueue, JSON.stringify(event));
    });
    client.on('disproveSuggestion', (event) => {
        pubsub.pub(outboundQueue, JSON.stringify(event));
        pubsub.pub(inboundQueue, JSON.stringify(event));
    })
    client.on('accusation', (event) => {        
        pubsub.pub(outboundQueue, JSON.stringify(event));
        pubsub.pub(inboundQueue, JSON.stringify(event));
    });
    client.on('endTurn', (event) => {
        pubsub.pub(outboundQueue, JSON.stringify(event));
        pubsub.pub(inboundQueue, JSON.stringify(event)); 
    });
});

// Handle client disconnect events
io.on('disconnect', function (client) {
    // mock for demo - to be refactored
    logger.info("A client with ID " + client.id + " is now disconnected");
});

// Handle client disconnect events
io.on('disconnect', function (client) {
    // mock for demo - to be refactored
    logger.info("A client with ID " + client.id + " is now disconnected");
});

// Handle client disconnect events
io.on('disconnect', function (client) {
    // mock for demo - to be refactored
    logger.info("A client with ID " + client.id + " is now disconnected");
});

// Subscribe to the outbound notification from queue and push them to the respective clients
pubsub.subscribeAndProcess(outboundQueue, function (channel, message) {
    const msg = JSON.parse(message);
    logger.info("Outbound message received : " + msg);
    // if (msg.meta.clientId) {
        // Notify the client whose request is rejected
        // if (msg.payload.status === 'failed') {
            // io.to(msg.meta.clientId).emit('roomPlacement', JSON.stringify(msg));
        // }
        // Notify all the connected clients about accepted state changes
        // else {
            // io.sockets.emit('roomPlacement', JSON.stringify(msg));
        // }
    //}
    if (msg.gameState) {
        io.sockets.emit('roomPlacement', JSON.stringify(msg));
    } else {
        io.sockets.emit('message', JSON.stringify(msg));
    }
});