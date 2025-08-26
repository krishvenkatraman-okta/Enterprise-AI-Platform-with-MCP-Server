# MCP External API - Quick Test Commands

## Your MCP Server Credentials
```
Server: http://localhost:5000
Client ID: mcp_inventory_server_001
Client Secret: mcp_server_secret_2024_inventory_access
Base64 Encoded: $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)
```

## Direct cURL Commands (Copy & Paste Ready)

### 1. Test California Warehouse
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{"query":{"type":"warehouse","filters":{"state":"California"}}}'
```

### 2. Test All Inventory
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{"query":{"type":"all_inventory"}}'
```

### 3. Test Low Stock Items
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{"query":{"type":"low_stock"}}'
```

### 4. Test Texas Warehouse
```bash
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{"query":{"type":"warehouse","filters":{"state":"Texas"}}}'
```

### 5. Get Server Configuration
```bash
curl -X GET http://localhost:5000/mcp/config
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