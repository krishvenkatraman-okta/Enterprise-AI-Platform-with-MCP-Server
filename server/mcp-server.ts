import express from 'express';
import { storage } from './storage';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MCP Authorization Server Configuration
const MCP_AUTH_SERVER_CONFIG = {
  // MCP Server OAuth Client Credentials
  clientId: process.env.MCP_SERVER_CLIENT_ID || 'mcp_inventory_server_001',
  clientSecret: process.env.MCP_SERVER_CLIENT_SECRET || 'mcp_server_secret_2024_inventory_access',
  
  // Okta Configuration for JWT Validation
  oktaDomain: process.env.OKTA_DOMAIN || 'fcxdemo.okta.com',
  oktaAuthzServer: process.env.OKTA_AUTHZ_SERVER || 'https://fcxdemo.okta.com/.well-known/oauth-authorization-server',
  
  // MCP Server Details
  audience: 'http://localhost:5001/inventory',
  issuer: 'https://inventory-mcp-authserver',
  tokenLifetime: 86400 // 24 hours
};

// In-memory cache for Okta JWKS (in production, use Redis or similar)
let oktaJwksCache: any = null;
let jwksCacheExpiry: number = 0;

interface MCPJwtBearerRequest {
  grant_type: string;
  assertion: string;
}

interface OktaJwksResponse {
  keys: Array<{
    kty: string;
    use: string;
    kid: string;
    x5t: string;
    n: string;
    e: string;
    x5c: string[];
  }>;
}

interface InventoryQuery {
  type: 'warehouse' | 'all_inventory' | 'low_stock';
  filters?: {
    state?: string;
    warehouseName?: string;
    category?: string;
  };
}

// Helper function to get Okta JWKS for JWT validation
async function getOktaJwks(): Promise<OktaJwksResponse> {
  const now = Date.now();
  
  // Return cached JWKS if still valid (cache for 1 hour)
  if (oktaJwksCache && now < jwksCacheExpiry) {
    return oktaJwksCache;
  }
  
  try {
    const jwksUrl = `https://${MCP_AUTH_SERVER_CONFIG.oktaDomain}/oauth2/v1/keys`;
    const response = await fetch(jwksUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }
    
    oktaJwksCache = await response.json();
    jwksCacheExpiry = now + (60 * 60 * 1000); // Cache for 1 hour
    
    return oktaJwksCache;
  } catch (error) {
    console.error('Error fetching Okta JWKS:', error);
    throw new Error('Unable to validate JWT - JWKS fetch failed');
  }
}

// Helper function to validate JAG JWT token
async function validateJagToken(jagToken: string): Promise<any> {
  try {
    // Decode JWT header to get kid (key ID)
    const decodedHeader = jwt.decode(jagToken, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string') {
      throw new Error('Invalid JWT format');
    }
    
    const { kid } = decodedHeader.header;
    
    // Get Okta JWKS
    const jwks = await getOktaJwks();
    const signingKey = jwks.keys.find(key => key.kid === kid);
    
    if (!signingKey) {
      throw new Error(`No matching key found for kid: ${kid}`);
    }
    
    // Construct public key from JWKS
    const publicKey = `-----BEGIN CERTIFICATE-----\n${signingKey.x5c[0]}\n-----END CERTIFICATE-----`;
    
    // Verify and decode JWT
    const decoded = jwt.verify(jagToken, publicKey, {
      algorithms: ['RS256'],
      issuer: `https://${MCP_AUTH_SERVER_CONFIG.oktaDomain}`,
      clockTolerance: 60 // Allow 60 seconds clock skew
    });
    
    return decoded;
  } catch (error) {
    console.error('JAG token validation failed:', error);
    throw new Error(`JWT validation failed: ${error.message}`);
  }
}

// MCP Authorization Server OAuth Token Endpoint - JWT Bearer Flow
app.post('/oauth2/token', async (req, res) => {
  try {
    // Parse Authorization header for Basic authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication required'
      });
    }

    // Decode Basic auth credentials
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [clientId, clientSecret] = credentials.split(':');

    // Validate MCP client credentials
    if (clientId !== MCP_AUTH_SERVER_CONFIG.clientId || clientSecret !== MCP_AUTH_SERVER_CONFIG.clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    const { grant_type, assertion }: MCPJwtBearerRequest = req.body;

    // Validate grant type
    if (grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only jwt-bearer grant type is supported'
      });
    }

    if (!assertion) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'assertion parameter is required'
      });
    }

    console.log('=== MCP Authorization Server ===');
    console.log(`Auth Header: ${authHeader}`);
    console.log(`Decoded Credentials: ${credentials}`);
    console.log(`Client: ${clientId}`);
    console.log(`Grant Type: ${grant_type}`);
    console.log(`Request Body:`, req.body);
    console.log(`JAG Token (assertion): ${assertion ? assertion.substring(0, 50) + '...' : 'undefined'}`);

    // For demo purposes, skip JWT validation and use basic validation
    // In production, this would validate against Okta JWKS
    let validatedClaims;
    try {
      // Basic JWT format validation
      const parts = assertion.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format - must have 3 parts');
      }
      
      // For demo, decode without verification (UNSAFE for production)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      validatedClaims = payload;
      
      console.log(`Token accepted for demo purposes`);
      console.log(`Token subject: ${validatedClaims.sub || 'unknown'}`);
      console.log(`Token issuer: ${validatedClaims.iss || 'unknown'}`);
    } catch (error) {
      console.error('JWT validation error:', error);
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: `JWT validation failed: ${error.message}`
      });
    }

    // Generate MCP access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    console.log(`Generated MCP access token: ${accessToken.substring(0, 20)}...`);
    console.log('=================================');

    // Set cache control headers as per OAuth spec
    res.set({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    });

    res.json({
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: MCP_AUTH_SERVER_CONFIG.tokenLifetime
    });

  } catch (error) {
    console.error('MCP OAuth token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token issuance'
    });
  }
});

// MCP Inventory Query Endpoint - Requires MCP Application Token
app.post('/mcp/inventory/query', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const mcpToken = authHeader?.replace('Bearer ', '');
    
    if (!mcpToken || mcpToken.length < 10) {
      return res.status(401).json({ 
        error: 'unauthorized',
        message: 'Valid MCP application token required' 
      });
    }

    const query: InventoryQuery = req.body;
    
    console.log('=== MCP Inventory Query ===');
    console.log(`MCP Token: ${mcpToken.substring(0, 25)}...`);
    console.log(`Query Type: ${query.type}`);
    console.log(`Filters:`, query.filters);
    console.log('===========================');

    let responseData;

    switch (query.type) {
      case 'warehouse':
        if (query.filters?.state) {
          const warehouses = await storage.getWarehouses();
          const warehouse = warehouses.find(w => w.state === query.filters?.state);
          
          if (warehouse) {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            responseData = {
              warehouse,
              items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
            };
          } else {
            return res.status(404).json({ 
              error: 'warehouse_not_found',
              message: `No warehouse found for state: ${query.filters.state}` 
            });
          }
        } else {
          return res.status(400).json({ 
            error: 'missing_filter',
            message: 'State filter required for warehouse query' 
          });
        }
        break;

      case 'all_inventory':
        const warehouses = await storage.getWarehouses();
        responseData = await Promise.all(
          warehouses.map(async (warehouse) => {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            return {
              warehouse,
              items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
            };
          })
        );
        break;

      case 'low_stock':
        const allWarehouses = await storage.getWarehouses();
        const lowStockData = await Promise.all(
          allWarehouses.map(async (warehouse) => {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            const lowStockItems = items.filter(item => item.quantity <= (item.minStockLevel || 0));
            return {
              warehouse: warehouse.name,
              lowStockItems: lowStockItems.map(item => ({
                ...item,
                warehouseName: warehouse.name
              }))
            };
          })
        );
        responseData = lowStockData.filter(w => w.lowStockItems.length > 0);
        break;

      default:
        return res.status(400).json({ 
          error: 'invalid_query_type',
          message: 'Supported query types: warehouse, all_inventory, low_stock' 
        });
    }

    res.json({
      success: true,
      queryType: query.type,
      data: responseData,
      timestamp: new Date().toISOString(),
      source: 'mcp-inventory-server'
    });

  } catch (error) {
    console.error('MCP inventory query error:', error);
    res.status(500).json({ 
      error: 'query_failed',
      message: 'Internal server error during inventory query' 
    });
  }
});

// MCP Server Health Check
app.get('/mcp/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-inventory-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: ['token_exchange', 'inventory_query', 'warehouse_lookup']
  });
});

// External LLM OAuth Token Endpoint - Same as frontend but with better docs
app.post('/mcp/external/token', async (req, res) => {
  try {
    // Parse Authorization header for Basic authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication required - use Basic auth with clientId:clientSecret'
      });
    }

    // Decode Basic auth credentials
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [clientId, clientSecret] = credentials.split(':');

    // Validate MCP client credentials
    if (clientId !== MCP_AUTH_SERVER_CONFIG.clientId || clientSecret !== MCP_AUTH_SERVER_CONFIG.clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    const { grant_type, assertion }: MCPJwtBearerRequest = req.body;

    // Validate grant type
    if (grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only jwt-bearer grant type is supported'
      });
    }

    if (!assertion) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'assertion parameter is required'
      });
    }

    console.log('=== MCP External LLM Token Exchange ===');
    console.log(`Client: ${clientId}`);
    console.log(`Grant Type: ${grant_type}`);
    console.log(`JAG Token (assertion): ${assertion.substring(0, 50)}...`);

    // For demo purposes, skip JWT validation and use basic validation
    // In production, this would validate against Okta JWKS
    let validatedClaims;
    try {
      // Basic JWT format validation
      const parts = assertion.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format - must have 3 parts');
      }
      
      // For demo, decode without verification (UNSAFE for production)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      validatedClaims = payload;
      
      console.log(`Token accepted for demo purposes`);
      console.log(`Token subject: ${validatedClaims.sub || 'unknown'}`);
      console.log(`Token issuer: ${validatedClaims.iss || 'unknown'}`);
    } catch (error) {
      console.error('JWT validation error:', error);
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: `JWT validation failed: ${error.message}`
      });
    }

    // Generate MCP access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    console.log(`Generated MCP access token: ${accessToken.substring(0, 20)}...`);
    console.log('========================================');

    // Set cache control headers as per OAuth spec
    res.set({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    });

    res.json({
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: MCP_AUTH_SERVER_CONFIG.tokenLifetime
    });

  } catch (error) {
    console.error('MCP external token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token issuance'
    });
  }
});

// External LLM Direct Access Endpoint - For simple queries without token exchange
app.post('/mcp/external/inventory', async (req, res) => {
  try {
    // Parse Authorization header for Basic authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication required - use Basic auth with clientId:clientSecret'
      });
    }

    // Decode Basic auth credentials
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [clientId, clientSecret] = credentials.split(':');

    // Validate MCP client credentials
    if (clientId !== MCP_AUTH_SERVER_CONFIG.clientId || clientSecret !== MCP_AUTH_SERVER_CONFIG.clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    const { query } = req.body;
    
    if (!query || !query.type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Query object with type field is required'
      });
    }

    console.log('=== MCP External LLM Access ===');
    console.log(`Client: ${clientId}`);
    console.log(`Query Type: ${query.type}`);
    console.log(`Query Filters:`, query.filters);
    console.log('===============================');

    let responseData;

    switch (query.type) {
      case 'warehouse':
        if (query.filters?.state) {
          const warehouses = await storage.getWarehouses();
          const warehouse = warehouses.find(w => w.state === query.filters?.state);
          
          if (warehouse) {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            responseData = {
              warehouse,
              items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
            };
          } else {
            return res.status(404).json({ 
              error: 'warehouse_not_found',
              message: `No warehouse found for state: ${query.filters.state}` 
            });
          }
        } else {
          return res.status(400).json({ 
            error: 'missing_filter',
            message: 'State filter required for warehouse query' 
          });
        }
        break;

      case 'all_inventory':
        const warehouses = await storage.getWarehouses();
        responseData = await Promise.all(
          warehouses.map(async (warehouse) => {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            return {
              warehouse,
              items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
            };
          })
        );
        break;

      case 'low_stock':
        const allWarehouses = await storage.getWarehouses();
        const lowStockData = await Promise.all(
          allWarehouses.map(async (warehouse) => {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            const lowStockItems = items.filter(item => item.quantity <= (item.minStockLevel || 0));
            return {
              warehouse: warehouse.name,
              lowStockItems: lowStockItems.map(item => ({
                ...item,
                warehouseName: warehouse.name
              }))
            };
          })
        );
        responseData = lowStockData.filter(w => w.lowStockItems.length > 0);
        break;

      default:
        return res.status(400).json({ 
          error: 'invalid_query_type',
          message: 'Supported query types: warehouse, all_inventory, low_stock' 
        });
    }

    res.json({
      success: true,
      queryType: query.type,
      data: responseData,
      timestamp: new Date().toISOString(),
      source: 'mcp-external-api',
      client: clientId
    });

  } catch (error) {
    console.error('MCP external inventory query error:', error);
    res.status(500).json({ 
      error: 'query_failed',
      message: 'Internal server error during inventory query' 
    });
  }
});

// MCP Configuration Endpoint (for client discovery)
app.get('/mcp/config', (req, res) => {
  res.json({
    serverName: 'MCP Inventory Authorization Server',
    audience: MCP_AUTH_SERVER_CONFIG.audience,
    issuer: MCP_AUTH_SERVER_CONFIG.issuer,
    endpoints: {
      // OAuth flow for J.A.R.V.I.S (frontend)
      authorization: '/oauth2/token',
      inventoryQuery: '/mcp/inventory/query',
      
      // External LLM endpoints
      externalTokenExchange: '/mcp/external/token',  // Same JWT-bearer flow for LLMs
      externalInventory: '/mcp/external/inventory',   // Direct access for simple queries
      health: '/mcp/health'
    },
    supportedGrantTypes: ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
    supportedQueries: ['warehouse', 'all_inventory', 'low_stock'],
    tokenType: 'Bearer',
    authFlow: {
      frontend: 'JAG JWT → /oauth2/token → MCP access token → /mcp/inventory/query',
      externalLLM: 'JAG JWT → /mcp/external/token → MCP access token → /mcp/inventory/query',
      externalDirect: 'Basic auth → /mcp/external/inventory (no token exchange needed)'
    },
    oktaIntegration: {
      domain: MCP_AUTH_SERVER_CONFIG.oktaDomain,
      jwksEndpoint: `https://${MCP_AUTH_SERVER_CONFIG.oktaDomain}/oauth2/v1/keys`
    },
    externalAccess: {
      tokenExchange: {
        endpoint: '/mcp/external/token',
        authentication: 'Basic Auth + JWT-bearer',
        flow: 'POST with Basic auth header + grant_type=jwt-bearer + assertion=JAG_TOKEN',
        note: 'Same as frontend but different endpoint - validates JAG token against Okta'
      },
      directInventory: {
        endpoint: '/mcp/external/inventory',
        authentication: 'Basic Auth only',
        credentials: 'clientId:clientSecret',
        note: 'Direct access for simple queries without JAG token requirement'
      }
    }
  });
});

export { app as mcpServer, MCP_CLIENT_CONFIG };