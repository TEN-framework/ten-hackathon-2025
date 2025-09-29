/**
 * Request Logging Middleware
 */

function requestLogger(logger) {
    return (req, res, next) => {
        const startTime = Date.now();
        
        // Log request
        logger.info('Incoming request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
            const duration = Date.now() - startTime;
            
            logger.info('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: duration,
                timestamp: new Date().toISOString()
            });

            originalEnd.call(this, chunk, encoding);
        };

        next();
    };
}

module.exports = { requestLogger };
