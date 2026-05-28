const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL;
const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
const REDIS_TLS = (process.env.REDIS_TLS === 'true');

let client;
try {
    if (REDIS_URL) {
        client = redis.createClient({ url: REDIS_URL });
    } else if (REDIS_PASSWORD) {
        // Build URL supporting username:password or :password
        let url;
        if (REDIS_USERNAME) {
            url = `redis://${encodeURIComponent(REDIS_USERNAME)}:${encodeURIComponent(REDIS_PASSWORD)}@${REDIS_HOST}:${REDIS_PORT}`;
        } else {
            url = `redis://:${encodeURIComponent(REDIS_PASSWORD)}@${REDIS_HOST}:${REDIS_PORT}`;
        }
        if (REDIS_TLS) url = url.replace('redis://', 'rediss://');
        client = redis.createClient({ url });
    } else {
        // No auth
        const url = (REDIS_TLS ? 'rediss' : 'redis') + `://${REDIS_HOST}:${REDIS_PORT}`;
        client = redis.createClient({ url });
    }
} catch (err) {
    console.error('Failed to create Redis client:', err);
    throw err;
}

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});
client.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (error) {
        if (error && error.message && /WRONGPASS/i.test(error.message)) {
            console.error('Redis auth failed: WRONGPASS. Please verify REDIS_USERNAME and REDIS_PASSWORD or use REDIS_URL in backend/.env');
        }
        console.log('Redis Connection Error:', error);
    }
};

connectRedis();

module.exports = client;
