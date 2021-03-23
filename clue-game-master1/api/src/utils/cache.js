const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const config = require('../config/db')

const client = redis.createClient(config.REDIS_CONN_STRING);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = { expire: 180 }) {
    this.useCache = true;
    this.expire = options.expire;
    this.hkey = JSON.stringify(options.key || this.mongooseCollection.name);

    return this;
}

mongoose.Query.prototype.exec = async function() {
    if (!this.useCache) {
        return await exec.apply(this, arguments);
    }

    const key = JSON.stringify({
        ...this.getQuery(),
        collection: this.mongooseCollection.name
    });

    const cachedValue = await client.hget(this.hkey, key);

    if (!cachedValue) {
        const result = await exec.apply(this, arguments);
        client.hset(this.hkey, key, JSON.stringify(result));
        client.expire(this.hkey, this.expire);
        return result;
    }

    const parsedCVal = JSON.parse(cachedValue);
    return Array.isArray(parsedCVal)
        ? parsedCVal.map( item => new this.model(item))
        : new this.model(parsedCVal);
};

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}