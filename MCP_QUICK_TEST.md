# MCP External API - Quick Test Commands

## Your MCP Server Credentials

**Production (External LLM Access):**
```
Server: https://your-app.vercel.app
Client ID: mcp_inventory_server_001
Client Secret: mcp_server_secret_2024_inventory_access
Base64 Encoded: $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)
```

**Local Development:**
```
Server: http://localhost:5000
Client ID: mcp_inventory_server_001
Client Secret: mcp_server_secret_2024_inventory_access
```

## Production Commands (For External LLMs)

**Important**: External LLMs must use the JWT-bearer flow, not direct endpoints.

### 1. Get Access Token
```bash
curl -X POST https://your-app.vercel.app/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=<REAL_JAG_TOKEN>"
```

### 2. Test California Warehouse  
```bash
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_STEP_1>" \
  -d '{"type":"warehouse","filters":{"state":"California"}}'
```

### 3. Test All Inventory
```bash
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_STEP_1>" \
  -d '{"type":"all_inventory"}'
```

### 4. Test Texas Warehouse
```bash
curl -X POST https://your-app.vercel.app/api/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_STEP_1>" \
  -d '{"type":"warehouse","filters":{"state":"Texas"}}'
```

### 5. Get Server Configuration
```bash
curl -X GET https://your-app.vercel.app/api/config
```

## Expected Response Format
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
    "items": [...],
    "totalItems": 5,
    "lowStockItems": [...]
  },
  "timestamp": "2025-01-26T23:20:00.000Z",
  "source": "mcp-external-api",
  "client": "mcp_inventory_server_001"
}
```

## External LLM Integration Patterns

### OpenAI Function Calling
```json
{
  "name": "query_inventory",
  "description": "Query Atlas Beverages inventory system",
  "parameters": {
    "type": "object",
    "properties": {
      "query_type": {
        "type": "string",
        "enum": ["warehouse", "all_inventory", "low_stock"],
        "description": "Type of inventory query"
      },
      "state": {
        "type": "string",
        "enum": ["California", "Texas", "Nevada"],
        "description": "State filter for warehouse queries"
      }
    },
    "required": ["query_type"]
  }
}
```

### Anthropic Claude Tool Use
```json
{
  "name": "mcp_inventory_query",
  "description": "Query inventory data from Atlas Beverages MCP server",
  "input_schema": {
    "type": "object",
    "properties": {
      "query_type": {
        "type": "string",
        "enum": ["warehouse", "all_inventory", "low_stock"]
      },
      "filters": {
        "type": "object",
        "properties": {
          "state": {"type": "string"}
        }
      }
    },
    "required": ["query_type"]
  }
}
```

## Error Handling Examples

### Invalid Credentials (401)
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic invalid_credentials" \
  -d '{"query":{"type":"warehouse","filters":{"state":"California"}}}'
```

### Missing Query Type (400) 
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{}'
```

### Invalid State Filter (404)
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{"query":{"type":"warehouse","filters":{"state":"InvalidState"}}}'
```