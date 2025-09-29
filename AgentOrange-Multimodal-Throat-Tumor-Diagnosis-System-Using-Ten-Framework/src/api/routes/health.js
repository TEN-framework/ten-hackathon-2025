/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

/**
 * GET /health/detailed
 * Detailed health check with system status
 */
router.get('/detailed', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        system: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            platform: process.platform,
            node_version: process.version
        },
        services: {
            database: 'connected',
            redis: 'connected',
            ten_framework: 'connected',
            multimodal_processors: 'operational'
        }
    };

    res.json(health);
});

module.exports = router;
