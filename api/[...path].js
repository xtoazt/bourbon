const Corrosion = require('../lib/server/index.js');
const AdvancedMiddleware = require('../lib/advanced-middleware.js');
const SessionManager = require('../lib/session-manager.js');
const EnhancedRewriter = require('../lib/enhanced-rewriter.js');

// Initialize enhanced components
const middleware = new AdvancedMiddleware();
const sessionManager = new SessionManager({
    sessionDir: '/tmp/bourbon-sessions',
    maxSessions: 1000,
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
});

// Initialize the proxy with enhanced configuration
const proxy = new Corrosion({
    codec: 'xor',
    prefix: '/api/',
    title: 'Bourbon 2.0',
    ws: true,
    cookie: true,
    standardMiddleware: true
});

// Add advanced middleware (commented out for now to avoid conflicts)
// middleware.use('request', AdvancedMiddleware.headerCorrection());
// middleware.use('request', AdvancedMiddleware.rateLimiter({
//     windowMs: 60000, // 1 minute
//     maxRequests: 100
// }));
// middleware.use('response', AdvancedMiddleware.securityHeaders());
// middleware.use('response', AdvancedMiddleware.cookieManager());
// middleware.use('response', AdvancedMiddleware.contentTypeDetection());
middleware.use('error', AdvancedMiddleware.errorHandler());

// Initialize enhanced rewriter
const rewriter = new EnhancedRewriter({
    proxyUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
    enableMinification: true,
    enableCompression: true,
    customScripts: [
        // Add any custom scripts here
    ],
    blockedDomains: [
        // Add domains to block here
    ]
});

// Bundle scripts for client-side functionality
proxy.bundleScripts();

module.exports = async (req, res) => {
    try {
        // Set CORS headers for cross-origin requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Handle session management endpoints
        if (req.url.startsWith('/api/session')) {
            return handleSessionManagement(req, res);
        }

        // Handle WebSocket upgrades
        if (req.headers.upgrade === 'websocket') {
            return handleWebSocket(req, res);
        }

        // Handle proxy requests with enhanced features
        if (req.url.startsWith(proxy.prefix)) {
            return handleProxyRequest(req, res);
        }

        // Handle static files and frontend
        if (req.url === '/' || req.url.startsWith('/static/')) {
            return handleStaticRequest(req, res);
        }

        // For other requests, return 404
        res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle session management
async function handleSessionManagement(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.pathname.split('/').pop();
    const sessionId = req.headers['x-session-id'] || url.searchParams.get('sessionId');

    try {
        switch (action) {
            case 'create':
                const newSessionId = sessionManager.createSession({
                    userAgent: req.headers['user-agent'],
                    headers: req.headers
                });
                res.json({ sessionId: newSessionId });
                break;

            case 'get':
                if (!sessionId) {
                    res.status(400).json({ error: 'Session ID required' });
                    return;
                }
                const session = sessionManager.getSession(sessionId);
                if (!session) {
                    res.status(404).json({ error: 'Session not found' });
                    return;
                }
                res.json(sessionManager.exportSession(sessionId));
                break;

            case 'update':
                if (!sessionId) {
                    res.status(400).json({ error: 'Session ID required' });
                    return;
                }
                const updates = await getRequestBody(req);
                const updated = sessionManager.updateSession(sessionId, updates);
                res.json({ success: updated });
                break;

            case 'delete':
                if (!sessionId) {
                    res.status(400).json({ error: 'Session ID required' });
                    return;
                }
                const deleted = sessionManager.deleteSession(sessionId);
                res.json({ success: deleted });
                break;

            case 'stats':
                res.json(sessionManager.getStats());
                break;

            default:
                res.status(404).json({ error: 'Invalid session action' });
        }
    } catch (error) {
        console.error('Session management error:', error);
        res.status(500).json({ error: 'Session management failed' });
    }
}

// Handle WebSocket connections
async function handleWebSocket(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const targetUrl = url.searchParams.get('url');
    const sessionId = req.headers['x-session-id'];

    if (!targetUrl) {
        res.status(400).json({ error: 'Target URL required' });
        return;
    }

    // Add session context
    req.bourbonSession = sessionId ? sessionManager.getSession(sessionId) : null;
    req.bourbonTargetUrl = targetUrl;

    return proxy.upgrade(req, res);
}

// Handle proxy requests with enhanced features
async function handleProxyRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const targetUrl = url.searchParams.get('url');
    const sessionId = req.headers['x-session-id'];

    if (!targetUrl) {
        res.status(400).json({ error: 'Target URL required' });
        return;
    }

    // Get session if provided
    const session = sessionId ? sessionManager.getSession(sessionId) : null;

    // Create enhanced context
    const context = {
        request: req,
        response: res,
        proxyUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        session,
        targetUrl
    };

    try {
        // Use the original proxy request method directly
        return proxy.request(req, res);

    } catch (error) {
        console.error('Proxy request error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
}

// Handle static requests
async function handleStaticRequest(req, res) {
    if (req.url === '/') {
        // Serve the main page
        const fs = require('fs');
        const path = require('path');
        const indexPath = path.join(__dirname, '../index.html');
        
        try {
            const content = await fs.promises.readFile(indexPath, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
        } catch (error) {
            res.status(404).json({ error: 'Frontend not found' });
        }
    } else {
        res.status(404).json({ error: 'Not found' });
    }
}

// Helper function to get request body
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}
