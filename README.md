# Enterprise AI Platform with MCP Server

A comprehensive demo platform featuring dual interfaces: **Atlas Beverages** (inventory management) and **J.A.R.V.I.S** (AI assistant) with enterprise-grade Multi-Control Point (MCP) server architecture.

## 🚀 **Quick Start (Zero Dependencies)**

```bash
# Clone and run immediately - no database setup needed!
git clone <your-repo>
cd enterprise-ai-platform
npm install
npm run dev
```

**That's it!** The app runs on http://localhost:5000 with:
- ✅ Pre-populated demo inventory across 3 warehouses
- ✅ Okta authentication ready
- ✅ MCP server with JWT-bearer token exchange
- ✅ External LLM integration endpoints

## 🏗️ **Architecture Overview**

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

### **External LLM Integration**
```bash
# Step 1: Exchange JAG for MCP access token
curl -X POST http://localhost:5000/mcp/external/token \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JAG_TOKEN>"

# Step 2: Query inventory with access token
curl -X POST http://localhost:5000/mcp/inventory/query \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type": "warehouse", "filters": {"state": "California"}}'
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

### **Authentication**
- `POST /api/auth/callback` - OAuth callback handler
- `POST /api/auth/token-exchange` - JAG to access token exchange
- `GET /api/auth/sessions` - User session management
- `POST /api/auth/logout` - Session termination

### **Inventory Management**
- `GET /api/warehouses` - List all warehouses
- `GET /api/inventory/:warehouseId` - Get warehouse inventory
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### **MCP Server**
- `POST /oauth2/token` - OAuth token endpoint (frontend)
- `POST /mcp/external/token` - OAuth token endpoint (external LLMs)
- `POST /mcp/inventory/query` - Query inventory with access token
- `POST /mcp/external/inventory` - Direct inventory access (Basic auth)
- `GET /mcp/health` - Server status and configuration

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

### **Vercel (Recommended)**
```bash
# Deploy directly to Vercel
npm install -g vercel
vercel

# Or connect your GitHub repo to Vercel dashboard
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

### **Test Direct Inventory Access**
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"query": {"type": "warehouse", "filters": {"state": "California"}}}'
```

### **Test Token Exchange Flow**
```bash
# Use demo JAG token
curl -X POST http://localhost:5000/mcp/external/token \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2ZjeGRlbW8ub2t0YS5jb20iLCJzdWIiOiJ0ZXN0In0.test"
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