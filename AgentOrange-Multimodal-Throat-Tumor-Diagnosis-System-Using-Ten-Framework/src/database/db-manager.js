/**
 * Database Manager
 */

const { Pool } = require('pg');
const winston = require('winston');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/database.log' })
            ]
        });
    }

    async initialize() {
        try {
            this.logger.info('Initializing database connection...');

            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/voice_diagnosis',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.logger.info('Database connection established successfully');
            return true;

        } catch (error) {
            this.logger.error('Failed to initialize database:', error);
            throw error;
        }
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            this.logger.debug('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            this.logger.error('Database query failed:', { text, error: error.message });
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.logger.info('Database connection closed');
        }
    }
}

// Singleton instance
let dbManager = null;

async function initializeDatabase() {
    if (!dbManager) {
        dbManager = new DatabaseManager();
        await dbManager.initialize();
    }
    return dbManager;
}

function getDatabaseManager() {
    if (!dbManager) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbManager;
}

module.exports = {
    DatabaseManager,
    initializeDatabase,
    getDatabaseManager
};
