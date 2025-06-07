import { createClient } from 'redis';

export const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
});

redis.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await redis
        .connect()
        .then(() => {
            console.log('Redis client connected successfully');
        })
        .catch((err) => {
            console.error('Error connecting to Redis:', err);
        });
})();
