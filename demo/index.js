const http = require('http');
const fs = require('fs');
const path = require('path');
const Bourbon = require('../');
const proxy = new Bourbon({
    codec: 'xor',
    prefix: '/api/',
    title: 'Bourbon Demo'
});

proxy.bundleScripts();

const server = http.createServer((request, response) => {
    if (request.url.startsWith(proxy.prefix)) return proxy.request(request, response);
    response.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
});

server.on('upgrade', (clientRequest, clientSocket, clientHead) => 
    proxy.upgrade(clientRequest, clientSocket, clientHead)
);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🥃 Bourbon Demo running on http://localhost:${PORT}`);
});