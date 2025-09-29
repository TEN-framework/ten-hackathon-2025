/**
 * Error Handling Middleware
 */

function errorHandler(logger) {
    return (error, req, res, next) => {
        logger.error('Unhandled error', {
            error: error.message,
            stack: error.stack,
            method: req.method,
            url: req.url,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Don't expose internal errors in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        res.status(error.status || 500).json({
            error: 'Internal Server Error',
            message: isDevelopment ? error.message : 'An unexpected error occurred',
            ...(isDevelopment && { stack: error.stack })
        });
    };
}

module.exports = { errorHandler };
