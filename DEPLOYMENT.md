# Bourbon Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/bourbon)

### Option 2: Manual Deploy
1. Fork this repository
2. Connect to Vercel: `npx vercel`
3. Deploy: `vercel --prod`

## 🏠 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

## 📁 Project Structure

```
bourbon/
├── api/
│   └── [...path].js          # Vercel serverless function
├── lib/                      # Core proxy library
├── demo/                     # Local development demo
├── index.html               # Modern frontend interface
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies and scripts
└── README.md                # Documentation
```

## 🔧 Configuration

### Environment Variables
- `BOURBON_PREFIX`: API prefix (default: `/api/`)
- `BOURBON_CODEC`: URL encoding (default: `xor`)
- `BOURBON_TITLE`: Page title
- `BOURBON_WS`: WebSocket support (default: `true`)

### API Usage
```
https://your-domain.vercel.app/api/gateway?url=https://example.com
```

## ✨ Features

- 🚀 **Zero Configuration**: Deploy instantly
- 🔒 **Secure**: Built-in encryption
- ⚡ **Fast**: Serverless performance
- 🌐 **Global**: CDN distribution
- 🛡️ **Private**: No tracking
- 📱 **Responsive**: Mobile-friendly

## 🎨 Customization

The frontend can be customized by editing `index.html`. The proxy behavior can be modified in `api/[...path].js`.

## 📝 Notes

- Based on the original Corrosion proxy by TitaniumNetwork
- Optimized for Vercel's serverless platform
- Includes modern, responsive UI
- Supports WebSocket connections
- Built-in CORS handling
