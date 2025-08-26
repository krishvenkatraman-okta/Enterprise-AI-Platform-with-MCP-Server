# External LLM Integration with MCP Server

## Two Integration Approaches

### Approach 1: JWT-Bearer Flow (Recommended for Production)
**Same as frontend J.A.R.V.I.S but different endpoint**

LLM gets JAG token from Okta → Sends to MCP server → Gets access token → Queries inventory

```bash
# Step 1: LLM exchanges JAG token for MCP access token
curl -X POST http://localhost:5000/mcp/external/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JAG_TOKEN>"

# Response:
{
  "token_type": "Bearer",
  "access_token": "abc123...",
  "expires_in": 86400
}

# Step 2: LLM uses access token to query inventory
curl -X POST http://localhost:5000/mcp/inventory/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"type": "warehouse", "filters": {"state": "California"}}'
```

### Approach 2: Direct Access (For Testing/Simple Use Cases)
**Bypass JAG tokens entirely**

```bash
# Direct inventory query with Basic Auth
curl -X POST http://localhost:5000/mcp/external/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d '{"query": {"type": "warehouse", "filters": {"state": "California"}}}'
```

## Example: External LLM with JAG Token

### 1. LLM Token Exchange Request
```http
POST /mcp/external/token HTTP/1.1
Host: localhost:5000
Authorization: Basic bWNwX2ludmVudG9yeV9zZXJ2ZXJfMDAxOm1jcF9zZXJ2ZXJfc2VjcmV0XzIwMjRfaW52ZW50b3J5X2FjY2Vzcw==
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IktFWV9JRCJ9.eyJpc3MiOiJodHRwczovL2ZjeGRlbW8ub2t0YS5jb20iLCJzdWIiOiJ1c2VyX2lkIiwiYXVkIjoiaW52ZW50b3J5X2FwcCIsImV4cCI6MTY3MzQ2NzIwMCwiaWF0IjoxNjczNDYzNjAwfQ.signature
```

### 2. MCP Server Response
```json
{
  "token_type": "Bearer",
  "access_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expires_in": 86400
}
```

### 3. LLM Inventory Query
```http
POST /mcp/inventory/query HTTP/1.1
Host: localhost:5000
Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Content-Type: application/json

{
  "type": "warehouse",
  "filters": {
    "state": "California"
  }
}
```

## Production JAG Token Validation

**Current (Demo)**: Basic JWT format validation
**Production**: Full Okta JWKS validation

```typescript
// Enable this in production
async function validateJagToken(jagToken: string): Promise<any> {
  // Get Okta JWKS and validate signature
  const jwks = await getOktaJwks();
  const decoded = jwt.verify(jagToken, publicKey, {
    algorithms: ['RS256'],
    issuer: `https://${MCP_AUTH_SERVER_CONFIG.oktaDomain}`,
    audience: MCP_AUTH_SERVER_CONFIG.audience
  });
  return decoded;
}
```

## Error Responses

### Invalid Client Credentials (401)
```json
{
  "error": "invalid_client",
  "error_description": "Invalid client credentials"
}
```

### Invalid JAG Token (401)
```json
{
  "error": "invalid_grant", 
  "error_description": "JWT validation failed: Invalid signature"
}
```

### Missing Grant Type (400)
```json
{
  "error": "unsupported_grant_type",
  "error_description": "Only jwt-bearer grant type is supported"
}
```

## Environment Setup

```bash
export MCP_SERVER_CLIENT_ID="mcp_inventory_server_001"
export MCP_SERVER_CLIENT_SECRET="mcp_server_secret_2024_inventory_access"  
export OKTA_DOMAIN="fcxdemo.okta.com"
export OKTA_AUTHZ_SERVER="https://fcxdemo.okta.com/.well-known/oauth-authorization-server"
```

## Integration Examples

### OpenAI Assistant with Function Calling
```python
import requests
import base64

def get_mcp_access_token(jag_token):
    credentials = base64.b64encode("mcp_inventory_server_001:mcp_server_secret_2024_inventory_access".encode()).decode()
    
    response = requests.post(
        "http://localhost:5000/mcp/external/token",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {credentials}"
        },
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": jag_token
        }
    )
    
    return response.json()["access_token"]

def query_inventory(access_token, query_type, filters=None):
    payload = {"type": query_type}
    if filters:
        payload["filters"] = filters
    
    response = requests.post(
        "http://localhost:5000/mcp/inventory/query",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        },
        json=payload
    )
    
    return response.json()

# Usage
jag_token = "eyJ..." # From Okta
access_token = get_mcp_access_token(jag_token)
inventory = query_inventory(access_token, "warehouse", {"state": "California"})
```

### Anthropic Claude with Tool Use
```python
def mcp_inventory_tool(jag_token, query_type, state=None):
    """Tool for Claude to query inventory via MCP server"""
    
    # Step 1: Exchange JAG for access token
    access_token = get_mcp_access_token(jag_token)
    
    # Step 2: Query inventory
    filters = {"state": state} if state else None
    result = query_inventory(access_token, query_type, filters)
    
    return result
```

## Testing Your Integration

```bash
# Test token exchange
curl -v -X POST http://localhost:5000/mcp/external/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'mcp_inventory_server_001:mcp_server_secret_2024_inventory_access' | base64)" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2ZjeGRlbW8ub2t0YS5jb20iLCJzdWIiOiJ0ZXN0In0.test"
```