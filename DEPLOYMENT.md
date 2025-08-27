# Deployment Guide

## GitHub Repository Setup

This project is ready for immediate GitHub deployment with zero external dependencies.

### 1. Create GitHub Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit initial version
git commit -m "Initial commit: Enterprise AI Platform with MCP Server"

# Add GitHub remote (replace with your repository)
git remote add origin https://github.com/yourusername/enterprise-ai-platform.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B: GitHub Integration**
1. Connect your GitHub repository to Vercel
2. Import your repository 
3. Deploy automatically

### 3. Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### 4. Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Connect GitHub repository
2. Automatic deployment configuration
3. No additional setup needed

## Environment Configuration

### Required for Production

Create `.env` file with your Okta credentials:

```bash
# Okta Configuration
OKTA_DOMAIN=your-okta-domain.okta.com
OKTA_AUTHORIZATION_SERVER=https://your-okta-domain.okta.com/.well-known/oauth-authorization-server

# Client Credentials
INVENTORY_CLIENT_ID=your_inventory_client_id
INVENTORY_CLIENT_SECRET=your_inventory_client_secret
JARVIS_CLIENT_ID=your_jarvis_client_id  
JARVIS_CLIENT_SECRET=your_jarvis_client_secret

# MCP Server Credentials
MCP_SERVER_CLIENT_ID=mcp_inventory_server_001
MCP_SERVER_CLIENT_SECRET=mcp_server_secret_2024_inventory_access
```

### Demo Mode (No Environment Setup Needed)

The application works out-of-the-box with fallback credentials for demo purposes.

## Vercel Configuration

Create `vercel.json` in root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "dist/index.js"
    },
    {
      "src": "/oauth2/(.*)",
      "dest": "dist/index.js"
    },
    {
      "src": "/mcp/(.*)",
      "dest": "dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/dist/$1"
    }
  ]
}
```

## Build Commands

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm install
npm run build
npm start
```

## Features Working Out-of-Box

- ✅ In-memory storage with realistic demo data
- ✅ 3 warehouses with 13 inventory items
- ✅ Okta authentication (with demo fallbacks)
- ✅ MCP server with JWT-bearer token exchange
- ✅ External LLM integration endpoints
- ✅ Dual interface (Atlas Beverages + J.A.R.V.I.S)
- ✅ Cross-app token exchange
- ✅ Zero database dependencies

## Testing Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.vercel.app/mcp/health

# External LLM token exchange
curl -X POST https://your-app.vercel.app/mcp/external/token \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=demo_token"
```

## Troubleshooting

### Build Issues
- Ensure Node.js 18+ is used
- Run `npm install` to install dependencies
- Check `npm run check` for TypeScript errors

### Deployment Issues
- Verify build output in `dist/` directory
- Check environment variables are set correctly
- Ensure start command is `node dist/index.js`

### Demo Mode Issues
- Application works without environment variables
- Uses fallback Okta credentials for demo
- All data is in-memory and resets on restart

## Production Considerations

1. **Database Migration**: Replace in-memory storage with persistent database
2. **Session Storage**: Use Redis or database for session management  
3. **Environment Security**: Use proper secrets management
4. **Monitoring**: Add logging and error tracking
5. **HTTPS**: Ensure SSL/TLS certificates are configured
6. **CORS**: Configure appropriate CORS policies

This setup provides a complete enterprise-grade demo that can be deployed immediately to any modern hosting platform.