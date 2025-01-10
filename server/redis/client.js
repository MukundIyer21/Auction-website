const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
});

const QUEUES = {
    ITEM_OPERATIONS: 'item-operations',
};

async function addToQueue(queue, data) {
    await redis.lpush(queue, JSON.stringify(data));
}

async function getFromQueue(queue) {
    const data = await redis.rpop(queue);
    return data ? JSON.parse(data) : null;
}

module.exports = {
    redis,
    QUEUES,
    addToQueue,
    getFromQueue,
};