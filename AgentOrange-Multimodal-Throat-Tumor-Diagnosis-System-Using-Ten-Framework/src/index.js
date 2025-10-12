/**
 * Multimodal Throat Tumor Diagnosis System
 * Main Application Entry Point
 * 
 * Based on comprehensive documentation in docs/ folder
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const winston = require('winston');
require('dotenv').config();

// Import our modules
const { initializeTENFramework } = require('./ten-framework/ten-manager');
const { initializeDatabase } = require('./database/db-manager');
const { initializeRedis } = require('./cache/redis-manager');
const { initializeMultimodalProcessors } = require('./processors/multimodal-manager');
const { initializeMLModels } = require('./models/ml-manager');

// Import routes
const authRoutes = require('./api/routes/auth');
const analysisRoutes = require('./api/routes/analysis');
const multimodalRoutes = require('./api/routes/multimodal');
const healthRoutes = require('./api/routes/health');
const voiceGuidedFormRoutes = require('./api/routes/voice-guided-form');

// Import middleware
const { errorHandler } = require('./middleware/error-handler');
const { requestLogger } = require('./middleware/request-logger');
const { securityMiddleware } = require('./middleware/security');

class MultimodalDiagnosisApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3199;
        this.logger = this.setupLogger();
        this.rateLimiter = this.setupRateLimiter();
        
        this.initializeApp();
    }

    setupLogger() {
        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    setupRateLimiter() {
        return new RateLimiterMemory({
            keyPrefix: 'middleware',
            points: 100, // Number of requests
            duration: 60, // Per 60 seconds
        });
    }

    async initializeApp() {
        try {
            this.logger.info('Initializing Multimodal Throat Tumor Diagnosis System...');

            // Setup middleware
            this.setupMiddleware();

            // Initialize core services
            await this.initializeServices();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            this.logger.info('Application initialization completed successfully');
        } catch (error) {
            this.logger.error('Failed to initialize application:', error);
            process.exit(1);
        }
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"],
                    mediaSrc: ["'self'", "blob:", "data:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging
        this.app.use(requestLogger(this.logger));

        // Rate limiting
        this.app.use(async (req, res, next) => {
            try {
                await this.rateLimiter.consume(req.ip);
                next();
            } catch (rejRes) {
                res.status(429).json({ error: 'Too Many Requests' });
            }
        });

        // Security middleware
        this.app.use(securityMiddleware);
    }

    async initializeServices() {
        this.logger.info('Initializing core services...');

        // Initialize database
        await initializeDatabase();
        this.logger.info('Database initialized');

        // Initialize Redis cache
        await initializeRedis();
        this.logger.info('Redis cache initialized');

        // Initialize TEN Framework
        await initializeTENFramework();
        this.logger.info('TEN Framework initialized');

        // Initialize multimodal processors
        await initializeMultimodalProcessors();
        this.logger.info('Multimodal processors initialized');

        // Initialize ML models
        await initializeMLModels();
        this.logger.info('ML models initialized');
    }

    setupRoutes() {
        this.logger.info('Setting up API routes...');

        // Health check
        this.app.use('/health', healthRoutes);

        // Authentication routes
        this.app.use('/api/auth', authRoutes);

        // Analysis routes
        this.app.use('/api/analysis', analysisRoutes);

        // Multimodal routes
        this.app.use('/api/multimodal', multimodalRoutes);

        // Voice-guided form routes
        this.app.use('/api/voice-guided-form', voiceGuidedFormRoutes);

        // Frontend routes
        this.app.get('/voice-guided-form', (req, res) => {
            res.sendFile('voice-guided-form.html', { root: './src/frontend' });
        });

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'Multimodal Throat Tumor Diagnosis System',
                version: '1.0.0',
                description: 'AI-powered multimodal medical diagnosis system using TEN Framework',
                documentation: '/docs',
                health: '/health',
                status: 'operational'
            });
        });

        // Documentation endpoint
        this.app.get('/docs', (req, res) => {
            res.json({
                documentation: {
                    system_design: '/docs/system-design',
                    implementation_plan: '/docs/implementation-plan',
                    technical_specs: '/docs/technical-specs',
                    multimodal_architecture: '/docs/multimodal-architecture',
                    ten_finetuning: '/docs/ten-finetuning',
                    approach_comparison: '/docs/approach-comparison'
                },
                api_endpoints: {
                    authentication: '/api/auth',
                    analysis: '/api/analysis',
                    multimodal: '/api/multimodal',
                    voice_guided_form: '/api/voice-guided-form',
                    health: '/health'
                }
            });
        });

        // Frontend endpoint
        this.app.get('/frontend', (req, res) => {
            const path = require('path');
            res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        // Global error handler
        this.app.use(errorHandler(this.logger));
    }

    async start() {
        try {
            this.app.listen(this.port, () => {
                this.logger.info(`🚀 Multimodal Throat Tumor Diagnosis System running on port ${this.port}`);
                this.logger.info(`📚 Documentation available at http://localhost:${this.port}/docs`);
                this.logger.info(`🏥 Health check available at http://localhost:${this.port}/health`);
                this.logger.info(`🎯 Ready for multimodal medical diagnosis!`);
            });
        } catch (error) {
            this.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the application
const app = new MultimodalDiagnosisApp();
app.start().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
});

module.exports = app;
