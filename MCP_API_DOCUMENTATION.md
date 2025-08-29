# MCP Server API Documentation

## Overview
The MCP (Model Context Protocol) Server provides secure access to Atlas Beverages inventory data through multiple authentication flows:

1. **Frontend Flow**: JAG token → OAuth token → Inventory access (for J.A.R.V.I.S UI)
2. **External LLM Flow**: Direct Basic Auth → Inventory access (for external systems)

## Base URLs

**Production (External LLM Access):**
```
https://your-app.vercel.app
```

**Local Development:**
```  
http://localhost:5000
```

## Authentication Credentials
```
Client ID: mcp_inventory_server_001
Client Secret: mcp_server_secret_2024_inventory_access
```

## Endpoints

### 1. External LLM Direct Access (Recommended for external systems)

**Endpoint**: `POST /mcp/external/inventory`

**Authentication**: Basic Auth
```bash
Authorization: Basic <base64(clientId:clientSecret)>
```

**Request Body**:
```json
{
  "query": {
    "type": "warehouse|all_inventory|low_stock",
    "filters": {
      "state": "California|Texas|Nevada" // Required for warehouse type
    }
  }
}
```

**Important Note**: The `/mcp/external/inventory` endpoint is not available in the current implementation. External LLMs should use the JWT-bearer flow instead.

**Example cURL Commands** (Production URLs for external LLMs):

```bash
# Step 1: Exchange JAG token for access token
curl -X POST https://your-app.vercel.app/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=<JAG_TOKEN>"

# Step 2: Query California warehouse inventory
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"type": "warehouse", "filters": {"state": "California"}}'

# Step 2: Get all inventory across warehouses  
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"type": "all_inventory"}'
```

**Response Format**:
```json
{
  "success": true,
  "queryType": "warehouse",
  "data": {
    "warehouse": {
      "id": 1,
      "name": "West Coast Distribution",
      "location": "Los Angeles, CA",
      "state": "California"
    },
    "items": [
      {
        "id": 1,
        "name": "Premium Cola",
        "category": "Soft Drinks",
        "quantity": 150,
        "minStockLevel": 50,
        "price": 2.99
      }
    ],
    "totalItems": 5,
    "lowStockItems": []
  },
  "timestamp": "2025-01-26T23:15:00.000Z",
  "source": "mcp-external-api",
  "client": "mcp_inventory_server_001"
}
```

### 2. Frontend OAuth Flow (for J.A.R.V.I.S)

**Token Exchange**: `POST /api/oauth2/token`
```bash
curl -X POST https://your-app.vercel.app/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=<JAG_TOKEN>"
```

**Inventory Query**: `POST /api/mcp/inventory/query`
```bash
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"type": "all_inventory"}'
```

### 3. Configuration & Health

**Configuration**: `GET /api/config`
```bash
curl https://your-app.vercel.app/api/config
```

**Health Check**: `GET /api/health`
```bash
curl https://your-app.vercel.app/api/health
```

## Query Types

### warehouse
- **Required**: `filters.state` (California, Texas, Nevada)
- **Returns**: Specific warehouse data with inventory items

### all_inventory
- **Required**: None
- **Returns**: All warehouses with their inventory items

### low_stock
- **Required**: None
- **Returns**: Items that are below minimum stock levels across all warehouses

## Error Responses

```json
{
  "error": "invalid_client",
  "error_description": "Client authentication required"
}
```

```json
{
  "error": "invalid_request", 
  "error_description": "Query object with type field is required"
}
```

```json
{
  "error": "warehouse_not_found",
  "message": "No warehouse found for state: InvalidState"
}
```

## Integration Examples

### Python Example
```python
import requests
import base64
import json

# Credentials
client_id = "mcp_inventory_server_001"
client_secret = "mcp_server_secret_2024_inventory_access"
credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

# Step 1: Get access token (external LLM needs JAG token first)
token_response = requests.post(
    "https://your-app.vercel.app/api/oauth2/token",
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {credentials}"
    },
    data={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": "<JAG_TOKEN>"  # External LLM must obtain this from Okta
    }
)
access_token = token_response.json()["access_token"]

# Step 2: Query California warehouse
response = requests.post(
    "https://your-app.vercel.app/api/mcp/inventory/query",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    },
    json={
        "type": "warehouse",
        "filters": {
            "state": "California"
        }
    }
)

inventory_data = response.json()
print(json.dumps(inventory_data, indent=2))
```

### Node.js Example
```javascript
const axios = require('axios');

const credentials = Buffer.from('mcp_inventory_server_001:mcp_server_secret_2024_inventory_access').toString('base64');

async function queryInventory() {
  try {
    // Step 1: Get access token
    const tokenResponse = await axios.post(
      'https://your-app.vercel.app/api/oauth2/token',
      'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JAG_TOKEN>',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Step 2: Query inventory
    const response = await axios.post(
      'https://your-app.vercel.app/api/mcp/inventory/query',
      {
        type: 'all_inventory'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

queryInventory();
```

## Security Notes

1. **Production**: Enable proper JWT validation against Okta JWKS
2. **HTTPS**: Use HTTPS in production environments
3. **Rate Limiting**: Implement rate limiting for external endpoints
4. **Credentials**: Store client credentials securely (environment variables)
5. **Logging**: Monitor access patterns and failed authentication attempts

## Environment Variables

```bash
MCP_SERVER_CLIENT_ID=mcp_inventory_server_001
MCP_SERVER_CLIENT_SECRET=mcp_server_secret_2024_inventory_access
OKTA_DOMAIN=fcxdemo.okta.com
OKTA_AUTHZ_SERVER=https://fcxdemo.okta.com/.well-known/oauth-authorization-server
```