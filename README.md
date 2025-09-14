# Bourbon 2.0 🥃

**The Ultimate 5-in-1 Web Proxy** - Combining the best features from the most advanced proxy technologies.

Bourbon 2.0 is a revolutionary web proxy that combines the best features from [Rammerhead](https://github.com/binary-person/rammerhead), [Scramjet](https://github.com/MercuryWorkshop/scramjet), [Node-Unblocker](https://github.com/nfriedly/node-unblocker), and [PHP-Proxy](https://github.com/titaniumnetwork-dev/php-proxy) into one powerful, modern solution.

Originally based on [Corrosion](https://github.com/titaniumnetwork-dev/Corrosion) by TitaniumNetwork.

## Table of Contents
- [Bourbon](#bourbon)
  - [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [Vercel Deployment](#vercel-deployment)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [Middleware](#middleware)
- [Contributing](#contributing)

# Quick Start

## Vercel Deployment (Recommended)

1. **Fork this repository**
2. **Deploy to Vercel:**
   ```bash
   npx vercel
   ```
3. **Access your proxy:** Visit your Vercel URL and start browsing!

## Local Development

```bash
npm install
npm run dev
```

# Vercel Deployment

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/bourbon)

## Manual Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/bourbon.git
   cd bourbon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Deploy to Vercel:**
   ```bash
   npx vercel
   ```

4. **Configure environment variables (optional):**
   - `BOURBON_PREFIX`: Custom API prefix (default: `/api/`)
   - `BOURBON_CODEC`: URL encoding method (default: `xor`)

## ✨ Features

### 🔒 Advanced Security (Inspired by Node-Unblocker)
- **Rate Limiting**: Prevent abuse with configurable request limits
- **Security Headers**: Automatic removal of interfering security headers
- **IP Rotation**: Built-in support for custom proxy servers
- **Header Correction**: Smart Host and Referer header management
- **Error Handling**: Comprehensive error management system

### 🔧 Session Management (Inspired by Rammerhead)
- **Persistent Sessions**: Save cookies, localStorage, and sessionStorage
- **Cross-Device Sync**: Access your sessions from any device
- **Custom Settings**: Per-session configuration options
- **Session Statistics**: Real-time session data monitoring
- **Import/Export**: Backup and restore session data

### 🚀 Advanced Rewriting (Inspired by Scramjet)
- **Smart URL Rewriting**: Intelligent URL transformation
- **WebSocket Support**: Full WebSocket proxy capabilities
- **Content Minification**: Automatic HTML/CSS/JS optimization
- **Custom Scripts**: Inject custom JavaScript for enhanced functionality
- **Domain Blocking**: Block specific domains or content

### ⚡ Performance Optimizations (Inspired by PHP-Proxy)
- **Lightweight Architecture**: Minimal resource usage
- **Caching System**: Intelligent content caching
- **Compression**: Automatic response compression
- **Async Processing**: Non-blocking I/O operations
- **Memory Management**: Efficient session cleanup

### 🌐 Modern Infrastructure
- **Vercel Ready**: Zero-config deployment on Vercel
- **Serverless**: Auto-scaling serverless functions
- **Global CDN**: Worldwide content delivery
- **TypeScript Support**: Modern development experience
- **RESTful API**: Complete session management API

### 🛡️ Privacy & Security
- **No Logging**: Zero data collection or storage
- **No Tracking**: Complete anonymity
- **Encrypted Connections**: End-to-end encryption
- **CORS Support**: Cross-origin request handling
- **Custom Headers**: Flexible header management

# Local Development

## Prerequisites

- Node.js 16+ 
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access the proxy:** Open http://localhost:3000

## API Usage

Access websites through the proxy using:
```
https://your-domain.vercel.app/api/gateway?url=https://example.com
```

# Configuration

Bourbon can be configured through environment variables or by modifying the API handler:

## Environment Variables

- `BOURBON_PREFIX`: API endpoint prefix (default: `/api/`)
- `BOURBON_CODEC`: URL encoding method (`base64`, `plain`, `xor`)
- `BOURBON_TITLE`: Page title for proxied content
- `BOURBON_WS`: Enable WebSocket support (default: `true`)

## Advanced Configuration

```javascript
const proxy = new Corrosion({
    prefix: '/api/',           // API endpoint prefix
    title: 'Bourbon Proxy',    // Page title
    ws: true,                  // WebSocket support
    cookie: true,              // Cookie handling
    codec: 'xor',             // URL encoding
    standardMiddleware: true   // Use built-in middleware
});
```

# Middleware

Middleware are functions that will be executed either before request or after response. These can alter the way a request is made or response is sent.

```javascript
function(ctx) {r
  ctx.body; // (Request / Response) Body (Will return null if none)
  ctx.headers; // (Request / Response) Headers
  ctx.url; // WHATWG URL
  ctx.flags; // URL Flags
  ctx.origin; // Request origin
  ctx.method; // Request method
  ctx.rewrite; // Corrosion object
  ctx.statusCode; // Response status (Only available on response)
  ctx.agent; // HTTP agent
  ctx.address; // Address used to make remote request
  ctx.clientSocket; // Node.js Server Socket (Only available on upgrade)
  ctx.clientRequest; // Node.js Server Request
  ctx.clientResponse; // Node.js Server Response
  ctx.remoteResponse; // Node.js Remote Response (Only available on response)
};
```

### Default middleware

- Request
  - requestHeaders

- Response
  - responseHeaders
  - decompress
  - rewriteBody

### Available Middleware

#### address (Request)
  - `arr` Array of IP addresses to use in request.

```javascript
const Corrosion = require('corrosion');
const proxy = new Corrosion({
  requestMiddleware: [
    Corrosion.middleware.address([ 
      0.0.0.0, 
      0.0.0.0 
    ]),  
  ],
});
```

#### blacklist
  - `arr` Array of hostnames to block clients from seeing.
  -  `page` Block page.

```javascript
const Corrosion = require('corrosion');
const proxy = new Corrosion({
  requestMiddleware: [
    Corrosion.middleware.blacklist([ 
      'example.org',
      'example.com',
    ], 'Page is blocked'),  
  ],
});
```

# Contributing

We welcome contributions to Bourbon! Here's how you can help:

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/bourbon.git`
3. Install dependencies: `npm install`
4. Make your changes
5. Test locally: `npm run dev`
6. Submit a pull request

## Areas for Improvement

- Enhanced error handling
- Better TypeScript support
- Improved documentation
- Performance optimizations
- Additional middleware options

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original [Corrosion](https://github.com/titaniumnetwork-dev/Corrosion) by TitaniumNetwork
- [Vercel](https://vercel.com) for serverless hosting platform
