const redis = require('redis');

const client = redis.createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD || 'nq8w7qjVTcTdiG0FqNfGxYbb6IEHHoju',
    socket: {
        host: process.env.REDIS_HOST || 'income-request-yoke-84808.db.redis.io',
        port: process.env.REDIS_PORT || 14889
    }
});

client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.log('Redis Connection Error:', error);
    }
};

connectRedis();

module.exports = client;
