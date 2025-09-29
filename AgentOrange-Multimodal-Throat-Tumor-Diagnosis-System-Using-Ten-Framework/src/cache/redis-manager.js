/**
 * Redis Cache Manager
 */

const redis = require('redis');
const winston = require('winston');

class RedisManager {
    constructor() {
        this.client = null;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/redis.log' })
            ]
        });
    }

    async initialize() {
        try {
            this.logger.info('Initializing Redis connection...');

            this.client = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            this.client.on('error', (err) => {
                this.logger.error('Redis Client Error:', err);
            });

            this.client.on('connect', () => {
                this.logger.info('Redis client connected');
            });

            await this.client.connect();

            // Test connection
            await this.client.ping();

            this.logger.info('Redis connection established successfully');
            return true;

        } catch (error) {
            this.logger.error('Failed to initialize Redis:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error('Redis GET failed:', { key, error: error.message });
            throw error;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            await this.client.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            this.logger.error('Redis SET failed:', { key, error: error.message });
            throw error;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            this.logger.error('Redis DEL failed:', { key, error: error.message });
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.quit();
            this.logger.info('Redis connection closed');
        }
    }
}

// Singleton instance
let redisManager = null;

async function initializeRedis() {
    if (!redisManager) {
        redisManager = new RedisManager();
        await redisManager.initialize();
    }
    return redisManager;
}

function getRedisManager() {
    if (!redisManager) {
        throw new Error('Redis not initialized. Call initializeRedis() first.');
    }
    return redisManager;
}

module.exports = {
    RedisManager,
    initializeRedis,
    getRedisManager
};
