const redis = require('redis');
const logger = require('../logging/logger');

const redisConnString = {host: "cq", port: 6379}; // no auth
const consumer = redis.createClient(redisConnString);
const publisher = redis.createClient(redisConnString);

// Subscribe to a given channel
const sub = (channelName) => {
    consumer.subscribe(channelName);
};

// For publishing events to a given channel
const pub = (channelName, message) => {
    publisher.publish(channelName, message, () => {
        logger.info("Published message " + JSON.stringify(message) + " to " + channelName);
    });
};

// Clean up connections when a consumer error is encountered
consumer.on('error', function (err) {
    logger.error("Consumer error encountered. Consumer shutdown initiated. Error details : " + err);
    consumer.unsubscribe();
    consumer.quit();
});

// Conn validator
consumer.on('subscribe', () => {
   logger.debug("Consumer connection established - ready to consume")
});

// Defines the logic to handle events
const processEvent = (messageHandler) => {
    consumer.on("message", messageHandler)
};

// Helper function to consume messages from a channel and process them
const subscribeAndProcess = function (channel, handler) {
    sub(channel);
    processEvent(handler);
};

module.exports = {pub, sub, subscribeAndProcess};