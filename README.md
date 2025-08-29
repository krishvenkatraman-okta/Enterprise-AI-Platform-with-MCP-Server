# Enterprise AI Platform with MCP Server

A comprehensive demo platform featuring dual interfaces: **Atlas Beverages** (inventory management) and **J.A.R.V.I.S** (AI assistant) with enterprise-grade Multi-Control Point (MCP) server architecture.

## 🚀 **Quick Start (Zero Dependencies)**

```bash
# Clone and run immediately - no database setup needed!
git clone https://github.com/yourusername/enterprise-ai-platform.git
cd enterprise-ai-platform
npm install
npm run dev
```

**🚀 One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/enterprise-ai-platform)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/enterprise-ai-platform)

**Local Development:** `npm run dev` → http://localhost:5000  
**Production Deploy:** Vercel/Netlify → https://your-app.vercel.app

**Features included:**

✅ **Dual interface system** - Atlas Beverages + J.A.R.V.I.S  
✅ **Working OAuth2 authentication** - Complete login/logout flow  
✅ **Cross-application token exchange** - JAG tokens for inventory access  
✅ **External LLM integration** - Production-ready MCP endpoints  
✅ **Vercel deployment ready** - Zero-config serverless functions  
✅ **Pre-populated demo data** - 3 warehouses, 13 inventory items  
✅ **Real-time inventory queries** - State-based warehouse filtering

## 🏗️ **Architecture Overview**

### **Latest Improvements (August 2025)** 🆕
- ✅ **Fixed Vercel deployment** - Consolidated all endpoints into single `api/server.js`
- ✅ **Resolved JSON parsing errors** - Proper serverless function routing  
- ✅ **Fixed data structure mismatches** - Frontend and backend now fully compatible
- ✅ **Working logout functionality** - Complete session management
- ✅ **Enhanced external LLM integration** - Production-ready OAuth2 endpoints
- ✅ **Warehouse-specific queries** - Precise state-based filtering
- ✅ **Cross-interface authentication** - Seamless JAG token exchange

### **Dual Interface System**
- **Atlas Beverages**: Inventory management interface
- **J.A.R.V.I.S**: AI assistant with inventory access via JAG tokens

### **In-Memory Storage (Demo Ready)**
- No database dependencies
- Realistic demo data pre-loaded
- Session-based persistence
- Perfect for GitHub/Vercel deployment

### **MCP Authorization Server**
- OAuth 2.0 JWT-bearer grant type
- JAG token validation against Okta
- Cross-application token exchange
- External LLM integration support

## 📊 **Demo Data**

The platform starts with realistic inventory across 3 warehouses:

### **California Warehouse** (Los Angeles)
- Premium Cola Classic (150 units)
- Craft IPA Selection (45 units) 
- Energy Boost Original (200 units)
- Sparkling Water Lemon (30 units - LOW STOCK)
- Organic Green Tea (80 units)

### **Texas Warehouse** (Austin)
- Sweet Tea Southern Style (120 units)
- Local Root Beer (85 units)
- Sports Hydration Blue (180 units)
- BBQ Cola Limited (25 units - LOW STOCK)

### **Nevada Warehouse** (Las Vegas)
- Desert Spring Water (300 units)
- Premium Mixer Tonic (75 units)
- Luxury Vodka Selection (40 units)
- Casino Energy Rush (15 units - LOW STOCK)

## 🔐 **Authentication Flows**

### **Frontend (J.A.R.V.I.S & Atlas)**
1. User authenticates via Okta OIDC
2. Receives JAG (JSON Authorization Grant) token
3. JAG token exchanged for MCP access token
4. Access inventory via MCP server

### **External LLM Integration** 🤖

**Production URLs** (Vercel deployment):
```bash
# Step 1: Exchange JAG for MCP access token
curl -X POST https://your-app.vercel.app/api/oauth2/token \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=<JAG_TOKEN>"

# Step 2: Query inventory with access token  
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type": "warehouse", "filters": {"state": "California"}}'
```

**Local development:**
```bash
# Same endpoints work locally on http://localhost:5000
curl -X POST http://localhost:5000/api/oauth2/token \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=<JAG_TOKEN>"
```

## 🛠️ **Tech Stack**

### **Frontend**
- React 18 + TypeScript
- Radix UI + shadcn/ui + Tailwind CSS
- TanStack Query for state management
- Wouter for routing

### **Backend** 
- Express.js + TypeScript
- In-memory storage (no database needed)
- Okta OAuth 2.0 integration
- MCP server with JWT validation

### **Development**
- Vite for fast builds
- ESLint + TypeScript for code quality
- Hot reload for development

## 🌐 **API Endpoints**

### **Authentication & Sessions**
- `GET /api/config` - Get Okta configuration (client IDs, domains)
- `POST /api/auth/callback` - OAuth callback handler with PKCE
- `POST /api/auth/login` - Process ID token and create session
- `POST /api/auth/token-exchange` - JAG to access token exchange (J.A.R.V.I.S)
- `POST /api/auth/logout` - Session termination and cleanup

### **Inventory Management** 
- `GET /api/warehouses` - List all warehouses
- `GET /api/inventory/:warehouseId` - Get warehouse inventory

### **MCP Server (External LLM Integration)**
- `POST /api/oauth2/token` - OAuth2 JWT-bearer token exchange
- `POST /api/mcp/inventory/query` - Query inventory with access token  
- `GET /api/health` - Server status and configuration

**Note**: All endpoints are consolidated into `/api/server.js` for Vercel serverless compatibility.

## 🔧 **Environment Setup**

Create `.env` file for production use:

```bash
# Okta Configuration
OKTA_DOMAIN=your-okta-domain.okta.com
OKTA_AUTHORIZATION_SERVER=https://your-okta-domain.okta.com/.well-known/oauth-authorization-server

# Client Credentials (or use demo defaults)
INVENTORY_CLIENT_ID=your_inventory_client_id
INVENTORY_CLIENT_SECRET=your_inventory_client_secret
JARVIS_CLIENT_ID=your_jarvis_client_id  
JARVIS_CLIENT_SECRET=your_jarvis_client_secret

# MCP Server Credentials (or use demo defaults)
MCP_SERVER_CLIENT_ID=mcp_inventory_server_001
MCP_SERVER_CLIENT_SECRET=mcp_server_secret_2024_inventory_access
```

**Note**: Demo works without environment setup using fallback credentials.

## 📋 **Deployment**

### **Vercel (Recommended)** ⚡
**Architecture**: All API routes consolidated into single `api/server.js` file for serverless compatibility.

```bash
# Option 1: Deploy directly to Vercel
npm install -g vercel
vercel

# Option 2: Connect your GitHub repo to Vercel dashboard
# - Import your GitHub repository
# - Vercel automatically detects the configuration
# - Set environment variables in Vercel dashboard (optional)
```

**File Structure** (Vercel-optimized):
```
api/
├── server.js          # ← All endpoints (OAuth2 + MCP + Auth)
└── (no other files)   # ← Removed individual function files

vercel.json            # ← Routes all /api/* to server.js
```

### **Docker**
```bash
# Build and run with Docker
docker build -t enterprise-ai-platform .
docker run -p 5000:5000 enterprise-ai-platform
```

### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 **Testing the Integration**

### **Test MCP Health**
```bash
curl http://localhost:5000/mcp/health | jq .
```

### **Test OAuth2 Token Exchange** 🔐
```bash
# Step 1: Get MCP access token using JAG
curl -X POST http://localhost:5000/api/oauth2/token \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=<REAL_JAG_TOKEN_FROM_JARVIS>"

# Expected response:
# {
#   "token_type": "Bearer",
#   "access_token": "abc123def456...",
#   "expires_in": 86400,
#   "scope": "inventory:read"
# }
```

### **Test Inventory Query** 📊
```bash
# Step 2: Query California warehouse
curl -X POST http://localhost:5000/api/mcp/inventory/query \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_STEP_1>" \
  -H "Content-Type: application/json" \
  -d '{"type": "warehouse", "filters": {"state": "California"}}'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "warehouse": {"id": "warehouse-ca-001", "name": "West Coast Distribution"},
#     "items": [...],
#     "totalItems": 5,
#     "lowStockItems": [...]
#   }
# }
```

## 📚 **Documentation**

- [`EXTERNAL_LLM_INTEGRATION.md`](./EXTERNAL_LLM_INTEGRATION.md) - External LLM integration guide
- [`MCP_API_DOCUMENTATION.md`](./MCP_API_DOCUMENTATION.md) - Complete MCP API reference
- [`MCP_QUICK_TEST.md`](./MCP_QUICK_TEST.md) - Quick testing guide

## 🤝 **Contributing**

This is a demo application showcasing enterprise-grade patterns:

1. Fork the repository
2. Create your feature branch
3. Make your changes (data persists during session)
4. Test with the MCP endpoints
5. Submit a pull request

## 📝 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Perfect for demos, POCs, and showcasing enterprise AI integration patterns without complex database setup.**