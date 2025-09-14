const Corrosion = require('../lib/server/index.js');

// Initialize the proxy with bourbon configuration
const proxy = new Corrosion({
    codec: 'xor',
    prefix: '/api/',
    title: 'Bourbon',
    ws: true,
    cookie: true,
    standardMiddleware: true
});

// Bundle scripts for client-side functionality
proxy.bundleScripts();

module.exports = async (req, res) => {
    // Set CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle WebSocket upgrades
    if (req.headers.upgrade === 'websocket') {
        return proxy.upgrade(req, res);
    }

    // Handle proxy requests
    if (req.url.startsWith(proxy.prefix)) {
        return proxy.request(req, res);
    }

    // For non-proxy requests, return 404
    res.status(404).json({ error: 'Not found' });
};
