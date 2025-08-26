import express from 'express';
import { storage } from './storage';
import { oktaService } from './services/okta';

const app = express();
app.use(express.json());

// MCP Server's Own OAuth Client Configuration (for inventory system access)
const MCP_SERVER_CONFIG = {
  clientId: process.env.MCP_SERVER_CLIENT_ID || 'mcp_inventory_server_001',
  clientSecret: process.env.MCP_SERVER_CLIENT_SECRET || 'mcp_server_secret_2024_inventory_access',
  audience: 'http://localhost:5001/inventory',
  oktaDomain: process.env.OKTA_DOMAIN || 'fcxdemo.okta.com'
};

interface MCPTokenExchangeRequest {
  jagToken: string;
}

interface InventoryQuery {
  type: 'warehouse' | 'all_inventory' | 'low_stock';
  filters?: {
    state?: string;
    warehouseName?: string;
    category?: string;
  };
}

// MCP Token Exchange Endpoint - JAG Token → Application Token via MCP Server credentials
app.post('/mcp/auth/token-exchange', async (req, res) => {
  try {
    const { jagToken }: MCPTokenExchangeRequest = req.body;
    
    if (!jagToken) {
      return res.status(400).json({ 
        error: 'missing_jag_token',
        message: 'JAG token is required' 
      });
    }

    // Validate JAG token format (basic validation)
    if (!jagToken.startsWith('eyJ')) {
      return res.status(401).json({ 
        error: 'invalid_jag_token',
        message: 'Invalid JAG token format' 
      });
    }

    console.log('=== MCP Server Token Exchange ===');
    console.log(`Received JAG Token (preview): ${jagToken.substring(0, 50)}...`);
    console.log(`MCP Server Client ID: ${MCP_SERVER_CONFIG.clientId}`);
    
    // MCP Server exchanges JAG token for application token using its own credentials
    const tokenExchangeResponse = await fetch(`https://${MCP_SERVER_CONFIG.oktaDomain}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        subject_token: jagToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:id-jag',
        audience: MCP_SERVER_CONFIG.audience,
        client_id: MCP_SERVER_CONFIG.clientId,
        client_secret: MCP_SERVER_CONFIG.clientSecret
      })
    });

    if (!tokenExchangeResponse.ok) {
      const errorData = await tokenExchangeResponse.text();
      console.error('MCP Server Okta token exchange failed:', errorData);
      return res.status(401).json({ 
        error: 'okta_token_exchange_failed',
        message: 'Failed to exchange JAG token with Okta using MCP server credentials' 
      });
    }

    const tokenData = await tokenExchangeResponse.json();
    
    console.log(`MCP Server obtained application token: ${tokenData.access_token.substring(0, 30)}...`);
    console.log(`Token type: ${tokenData.issued_token_type}`);
    console.log('==================================');

    res.json({
      success: true,
      applicationToken: tokenData.access_token,
      tokenType: 'mcp_application_token',
      issuedTokenType: tokenData.issued_token_type,
      audience: MCP_SERVER_CONFIG.audience,
      expiresIn: tokenData.expires_in || 3600,
      scope: 'inventory:read warehouse:read'
    });
  } catch (error) {
    console.error('MCP token exchange error:', error);
    res.status(500).json({ 
      error: 'token_exchange_failed',
      message: 'Internal server error during token exchange' 
    });
  }
});

// MCP Inventory Query Endpoint - Requires MCP Application Token
app.post('/mcp/inventory/query', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const mcpToken = authHeader?.replace('Bearer ', '');
    
    if (!mcpToken || !mcpToken.startsWith('eyJ')) {
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

// MCP Configuration Endpoint (for client discovery)
app.get('/mcp/config', (req, res) => {
  res.json({
    serverName: 'MCP Inventory Server',
    audience: MCP_SERVER_CONFIG.audience,
    endpoints: {
      tokenExchange: '/mcp/auth/token-exchange',
      inventoryQuery: '/mcp/inventory/query',
      health: '/mcp/health'
    },
    supportedQueries: ['warehouse', 'all_inventory', 'low_stock'],
    tokenType: 'mcp_application_token',
    authFlow: 'JAG token → MCP server exchanges → Application token → Inventory access'
  });
});

export { app as mcpServer, MCP_CLIENT_CONFIG };