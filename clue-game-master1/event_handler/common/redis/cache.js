const redis = require('redis');
const { promisify } = require('util');

const redisConnString = {host: "cq", port: 6379}; // no auth
const client = redis.createClient(redisConnString);

const hget = promisify(client.hget).bind(client)
const hset = promisify(client.hset).bind(client)
const hgetall = promisify(client.hgetall).bind(client)

const getObject = async function (objectName) {
    const result = await hgetall(objectName);
    return result;
};

const getKey = async function (objectName, key) {
    const result = await hget(objectName, key);
    return result;
}

const setKey = async function (objectName, key, value) {
    const result = await hset(objectName, key, value);
    return result;
}

const close = () => client.quit();

module.exports = {getKey, setKey, getObject, close}

