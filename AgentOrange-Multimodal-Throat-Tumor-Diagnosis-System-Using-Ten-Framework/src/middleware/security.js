/**
 * Security Middleware
 */

function securityMiddleware(req, res, next) {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Rate limiting headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '99');
    
    next();
}

module.exports = { securityMiddleware };
