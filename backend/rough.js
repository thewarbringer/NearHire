const redis = require('redis');

const client = redis.createClient({
    username: 'default',
    password: 'nq8w7qjVTcTdiG0FqNfGxYbb6IEHHoju',
    socket: {
        host: 'income-request-yoke-84808.db.redis.io',
        port: 14889
    }
});

client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
        
        // Test connection
        await client.set('foo', 'bar');
        const result = await client.get('foo');
        console.log('Redis Test Result:', result);
    } catch (error) {
        console.log('Redis Connection Error:', error);
    }
};

connectRedis();

module.exports = client;

