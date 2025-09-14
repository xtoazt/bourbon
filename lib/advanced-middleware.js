/**
 * Advanced Middleware System for Bourbon
 * Inspired by Node-Unblocker and enhanced with modern features
 */

class AdvancedMiddleware {
    constructor() {
        this.middlewares = {
            request: [],
            response: [],
            error: []
        };
    }

    // Add middleware to the chain
    use(type, middleware) {
        if (!this.middlewares[type]) {
            throw new Error(`Invalid middleware type: ${type}`);
        }
        this.middlewares[type].push(middleware);
    }

    // Execute middleware chain
    async execute(type, context) {
        const middlewares = this.middlewares[type];
        
        for (const middleware of middlewares) {
            try {
                await middleware(context);
            } catch (error) {
                console.error(`Middleware error in ${type}:`, error);
                if (type !== 'error') {
                    await this.execute('error', { ...context, error });
                }
                throw error;
            }
        }
    }

    // Security Headers Middleware
    static securityHeaders() {
        return async (context) => {
            const { response } = context;
            if (!response) return;

            // Remove security headers that could interfere with proxy
            const securityHeaders = [
                'Strict-Transport-Security',
                'Content-Security-Policy',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'Referrer-Policy',
                'Permissions-Policy'
            ];

            securityHeaders.forEach(header => {
                response.removeHeader(header);
            });

            // Add proxy-friendly headers
            response.setHeader('X-Proxy-By', 'Bourbon');
            response.setHeader('X-Content-Type-Options', 'nosniff');
        };
    }

    // Cookie Management Middleware
    static cookieManager() {
        return async (context) => {
            const { request, response } = context;
            
            if (response && response.headers && response.headers['set-cookie']) {
                const cookies = response.headers['set-cookie'];
                if (Array.isArray(cookies)) {
                    response.headers['set-cookie'] = cookies.map(cookie => {
                        // Ensure cookies work with proxy path
                        return cookie.replace(/Path=\/[^;]*/, 'Path=/');
                    });
                }
            }
        };
    }

    // Header Correction Middleware
    static headerCorrection() {
        return async (context) => {
            const { request, response } = context;
            
            if (request) {
                // Fix Host header
                if (request.headers.host) {
                    request.headers.host = request.headers.host.replace(/:\d+$/, '');
                }
                
                // Fix Referer header
                if (request.headers.referer) {
                    request.headers.referer = request.headers.referer.replace(
                        /^https?:\/\/[^\/]+/, 
                        context.proxyUrl || ''
                    );
                }
            }
        };
    }

    // Rate Limiting Middleware
    static rateLimiter(options = {}) {
        const requests = new Map();
        const {
            windowMs = 60000, // 1 minute
            maxRequests = 100,
            skipSuccessfulRequests = false
        } = options;

        return async (context) => {
            const { request } = context;
            if (!request) return;

            const clientIP = request.connection?.remoteAddress || 
                           request.headers['x-forwarded-for'] || 
                           'unknown';
            
            const now = Date.now();
            const windowStart = now - windowMs;
            
            if (!requests.has(clientIP)) {
                requests.set(clientIP, []);
            }
            
            const clientRequests = requests.get(clientIP);
            
            // Remove old requests
            while (clientRequests.length > 0 && clientRequests[0] < windowStart) {
                clientRequests.shift();
            }
            
            if (clientRequests.length >= maxRequests) {
                const error = new Error('Rate limit exceeded');
                error.statusCode = 429;
                throw error;
            }
            
            clientRequests.push(now);
        };
    }

    // Content Type Detection Middleware
    static contentTypeDetection() {
        return async (context) => {
            const { response } = context;
            if (!response || !response.headers) return;

            const contentType = response.headers['content-type'];
            
            if (contentType) {
                // Ensure proper content type handling
                if (contentType.includes('text/html')) {
                    response.setHeader('content-type', 'text/html; charset=utf-8');
                } else if (contentType.includes('text/css')) {
                    response.setHeader('content-type', 'text/css; charset=utf-8');
                } else if (contentType.includes('application/javascript')) {
                    response.setHeader('content-type', 'application/javascript; charset=utf-8');
                }
            }
        };
    }

    // URL Rewriting Middleware
    static urlRewriter(proxyUrl) {
        return async (context) => {
            const { response, body } = context;
            if (!response || !body) return;

            const contentType = response.headers['content-type'];
            
            if (contentType && contentType.includes('text/html')) {
                // Rewrite URLs in HTML content
                context.body = body.toString()
                    .replace(/https?:\/\/[^"'\s]+/g, (url) => {
                        try {
                            const urlObj = new URL(url);
                            return `${proxyUrl}/api/gateway?url=${encodeURIComponent(url)}`;
                        } catch {
                            return url;
                        }
                    });
            }
        };
    }

    // Error Handling Middleware
    static errorHandler() {
        return async (context) => {
            const { error, response } = context;
            if (!error || !response) return;

            console.error('Proxy error:', error);
            
            response.statusCode = error.statusCode || 500;
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            
            const errorPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bourbon Proxy Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #e74c3c; }
                    </style>
                </head>
                <body>
                    <h1 class="error">Proxy Error</h1>
                    <p>${error.message}</p>
                    <p><a href="/">Return to Bourbon</a></p>
                </body>
                </html>
            `;
            
            response.end(errorPage);
        };
    }
}

module.exports = AdvancedMiddleware;
