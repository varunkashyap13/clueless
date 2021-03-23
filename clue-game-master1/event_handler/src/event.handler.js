const pubsub = require('../common/redis/pubsub');
const logger = require('../common/logging/logger');
const cache = require('../common/redis/cache');
const inboundQueue = 'events:inbound';
const outboundQueue = 'events:outbound';

var roomsAllocation = {
    1 : null,
    2 : null,
    3 : null,
    4 : null,
    5 : null,
    6 : null
};

var clientPlacement = {}

const msgGen = (message, status) => {
    var ev = {
        payload : {
            roomAllocationState : {},
            status : ''
        },
        meta : {
            clientId : ''
        }
    };

    var tmp = JSON.parse(message);
    ev.payload.status = status;
    ev.meta.clientId = tmp.user;
    ev.payload.roomAllocationState = roomsAllocation;
    return ev;
};

var handleAllocation = (message) => {
    var msg = JSON.parse(message);
    var userId = msg.user;
    logger.info("Processing the event : " + msg);
    if ( roomsAllocation[msg.room]  != null ) {
        console.log('Room is already occupied by ', roomsAllocation[msg.room] )
        const failedRequest = msgGen(message,'failed');
        logger.info("Publishing message to " + outboundQueue + " : " + JSON.stringify(failedRequest));
        pubsub.pub(outboundQueue, JSON.stringify(failedRequest));
    } else {
        roomsAllocation[msg.room] = userId;
        if (clientPlacement.hasOwnProperty(userId) ) {
            roomsAllocation[clientPlacement[message.user]] = null;
        }
        clientPlacement[userId] = msg.room ;
        const successfulRequest = msgGen(message,'success');
        logger.info("Publishing message to " + outboundQueue + " : " + JSON.stringify(successfulRequest));
        pubsub.pub(outboundQueue, JSON.stringify(successfulRequest));
    }
};

pubsub.subscribeAndProcess(inboundQueue, function (channel, message) {
    logger.info("Inbound message received : " + JSON.parse(message));
    handleAllocation(message);
});

